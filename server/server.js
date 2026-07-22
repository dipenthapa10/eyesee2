const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')



const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})


//middleware
app.use(cors())
app.use(express.json()) //server read json
app.use(express.urlencoded({ extended: true })) // server read from data

//setup for static folder  ( yet to do)  
const PORT = 3001
const rooms = {}
const ROUND_RESULT_DELAY = 800

const clearRoundCooldowns = (room) => {
    room.players.forEach(player => {
        delete player.cooldownUntil
        delete player.correctUntil
    })
}

// game data
const { createRounds } = require('./gameData')

const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = '';
    for (let i = 0; i < 6; ++i) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id)

    socket.on('createRoom', (data) => {
        console.log(`room creation req form ${data.playerName || socket.id}`)

        const roomCode = generateRoomCode();

        rooms[roomCode] = {
            id: roomCode,
            hostId: socket.id,
            players: [{
                id: socket.id,
                name: data.playerName || 'Host',
                score: 0
            }],
            gameStarted: false,
            currentRound: 0,
            settings: { timer: 0, roundCount: 15, cooldownSeconds: 5 },
            deck: []
        };

        socket.join(roomCode)
        console.log(`room ${roomCode} successfully created by ${socket.id}`)

        socket.emit('roomCreated', {
            roomCode,
            players: rooms[roomCode].players,
            hostId: rooms[roomCode].hostId,
            settings: rooms[roomCode].settings

        })
    })

    socket.on('joinRoom', (data) => {
        console.log(`room joined by ${data.playerName || socket.id}`)

        console.log("joinRoom received on server:", data)
        console.log("rooms available:", Object.keys(rooms))
        console.log("looking for room:", data.roomCode)
        console.log("room exists?", !!rooms[data.roomCode])

        if (rooms[data.roomCode]) {
            rooms[data.roomCode].players.push({
                id: socket.id,
                name: data.playerName,
                score: 0
            })

            socket.join(data.roomCode)
            console.log(`new player has joined the room ${data.roomCode}`)

            io.to(data.roomCode).emit('playerJoined', {
                players: rooms[data.roomCode].players,
                hostId: rooms[data.roomCode].hostId,
                roomCode: data.roomCode,
                settings: rooms[data.roomCode].settings
            })
        }
        else {
            socket.emit("joinError", { message: "Room Not Found" })
        }
    })


    //when player disconnects 
    // `disconnecting` runs before Socket.IO removes the socket from its rooms.
    socket.on('disconnecting', () => {
        console.log('player disconnects:', socket.id)

        const roomCode = [...socket.rooms].find(room => room !== socket.id)
        const room = rooms[roomCode]

        if (!room) return

        if (room.hostId !== socket.id) {
            const player = room.players.find(existingPlayer => existingPlayer.id === socket.id)
            if (!player) return

            if (room.gameStarted) {
                player.connected = false
            } else {
                room.players = room.players.filter(existingPlayer => existingPlayer.id !== socket.id)
            }

            io.to(roomCode).emit('playerDisconnected', {
                players: room.players,
                playerId: socket.id
            })
            return
        }

        // A game cannot continue without its host. Stop its timer before
        // returning the remaining players to the lobby.
        clearInterval(room.interval)
        room.gameStarted = false
        room.players = room.players.filter(
            player => player.id !== socket.id && player.connected !== false
        )

        if (room.players.length === 0) {
            delete rooms[roomCode]
            return
        }

        // Promote the next connected player so the room can be started again.
        room.hostId = room.players[0].id

        io.to(roomCode).emit('hostDisconnected', {
            roomCode,
            players: room.players,
            hostId: room.hostId
        })
    })

    socket.on('updateLobbySettings', (data) => {
        const room = rooms[data.roomCode]
        if (!room || room.hostId !== socket.id || room.gameStarted) return

        const timer = Number(data.timer)
        const roundCount = Number(data.roundCount)
        const cooldownSeconds = Number(data.cooldownSeconds)

        if (![0, 5, 10, 15].includes(timer)) return
        if (!Number.isInteger(roundCount) || roundCount < 10 || roundCount > 20) return
        if (!Number.isInteger(cooldownSeconds) || cooldownSeconds < 3 || cooldownSeconds > 10) return

        room.settings = { timer, roundCount, cooldownSeconds }
        io.to(data.roomCode).emit('lobbySettingsUpdated', { settings: room.settings })
    })

    socket.on('startGame', (data) => {
        const roomCode = data.roomCode
        const room = rooms[roomCode]
        if (!room || room.hostId !== socket.id) return
        room.players.forEach(p => p.score = 0)
        clearRoundCooldowns(room)

        const timerDuration = room.settings.timer
        room.gameStarted = true
        room.roundLocked = false
        room.currentRound = 0
        room.timerDuration = timerDuration
        room.timer = timerDuration

        const roundCount = room.settings.roundCount
        const safeRoundCount = Math.min(Math.max(roundCount, 10), 20)
        const gameRounds = createRounds(safeRoundCount)

        room.roundCount = safeRoundCount
        room.rounds = gameRounds

        io.to(roomCode).emit('gameStarted', {
            rounds: room.rounds,
            currentRound: 0,
            timer: room.timer,
            timerDuration: room.timerDuration,
            roundCount: room.roundCount
        })

        if (timerDuration === 0) return

        room.interval = setInterval(() => {
            room.timer -= 1

            io.to(roomCode).emit('timerTick', {
                timer: room.timer
            })

            if (room.timer === 0) {
                room.currentRound += 1

                if (room.currentRound >= room.rounds.length) {
                    clearInterval(room.interval)

                    const winner = room.players.reduce((a, b) =>
                        a.score > b.score ? a : b
                    )

                    io.to(roomCode).emit('gameOver', {
                        winner: winner.name,
                        players: room.players
                    })

                    return
                }

                room.timer = room.timerDuration
                clearRoundCooldowns(room)
                io.to(roomCode).emit('cooldownUpdated', { players: room.players })

                io.to(roomCode).emit('newRound', {
                    currentRound: room.currentRound,
                    timer: room.timer
                })
            }
        }, 1000)
    })

    socket.on('wrongAnswer', (data) => {
        const roomCode = [...socket.rooms].find(r => r !== socket.id)
        const room = rooms[roomCode]
        const currentRound = room?.rounds?.[room.currentRound]

        if (
            !room ||
            room.roundLocked ||
            data.roundIndex !== room.currentRound ||
            data.symbol === currentRound?.match
        ) return

        const player = room.players.find(existingPlayer => existingPlayer.id === socket.id)
        if (!player || player.cooldownUntil > Date.now()) return

        const cooldownDuration = room.settings.cooldownSeconds * 1000
        player.cooldownUntil = Date.now() + cooldownDuration
        io.to(roomCode).emit('cooldownUpdated', { players: room.players })
        io.to(roomCode).emit('activityUpdate', {
            id: player.id,
            name: player.name,
            type: 'wrong',
            timestamp: Date.now()
        })

        setTimeout(() => {
            if (!rooms[roomCode] || player.cooldownUntil > Date.now()) return

            delete player.cooldownUntil
            io.to(roomCode).emit('cooldownUpdated', { players: room.players })
        }, cooldownDuration)
    })

    socket.on('cardMatch', (data) => {
        const roomCode = [...socket.rooms].find(r => r !== socket.id)

        if (!roomCode || !rooms[roomCode]) return

        const room = rooms[roomCode]
        const currentRound = room.rounds?.[room.currentRound]

        // Accept only the first correct click for the current round.
        const player = room.players.find(p => p.id === socket.id)

        if (
            room.roundLocked ||
            data.roundIndex !== room.currentRound ||
            data.symbol !== currentRound?.match ||
            !player ||
            player.cooldownUntil > Date.now()
        ) return

        room.roundLocked = true
        clearInterval(room.interval)

        player.score += 1
        player.correctUntil = Date.now() + ROUND_RESULT_DELAY

        io.to(roomCode).emit('scoreUpdated', { players: room.players })
        io.to(roomCode).emit('roundWon', {
            winner: player?.name || 'A player',
            players: room.players
        })
        io.to(roomCode).emit('activityUpdate', {
            id: player.id,
            name: player.name,
            type: 'correct',
            timestamp: Date.now()
        })

        setTimeout(() => {
            // The room can disappear while the result message is on screen.
            if (!rooms[roomCode]) return

            room.currentRound += 1

            if (room.currentRound >= room.rounds.length) {
                const winner = room.players.reduce((a, b) =>
                    a.score > b.score ? a : b
                )

                io.to(roomCode).emit('gameOver', {
                    winner: winner.name,
                    players: room.players
                })
                return
            }

            room.timer = room.timerDuration
            room.roundLocked = false
            clearRoundCooldowns(room)
            io.to(roomCode).emit('cooldownUpdated', { players: room.players })
            io.to(roomCode).emit('matchDone', {
                currentRound: room.currentRound,
                timer: room.timer
            })
            io.to(roomCode).emit('timerTick', { timer: room.timer })

            if (room.timerDuration === 0) return

            room.interval = setInterval(() => {
                room.timer -= 1
                io.to(roomCode).emit('timerTick', { timer: room.timer })

                if (room.timer !== 0) return

                room.currentRound += 1

                if (room.currentRound >= room.rounds.length) {
                    clearInterval(room.interval)
                    const winner = room.players.reduce((a, b) =>
                        a.score > b.score ? a : b
                    )
                    io.to(roomCode).emit('gameOver', {
                        winner: winner.name,
                        players: room.players
                    })
                    return
                }

                room.timer = room.timerDuration
                clearRoundCooldowns(room)
                io.to(roomCode).emit('cooldownUpdated', { players: room.players })
                io.to(roomCode).emit('newRound', {
                    currentRound: room.currentRound,
                    timer: room.timer
                })
            }, 1000)
        }, ROUND_RESULT_DELAY)
    })

    socket.on('restartGame', () => {
        const roomCode = [...socket.rooms].find(r => r !== socket.id)
        if (!roomCode || !rooms[roomCode]) return

        // stop old timer
        clearInterval(rooms[roomCode].interval)

        // reset room state
        rooms[roomCode].currentRound = 0
        rooms[roomCode].roundLocked = false
        rooms[roomCode].timer = rooms[roomCode].timerDuration
        rooms[roomCode].players.forEach(p => p.score = 0)
        clearRoundCooldowns(rooms[roomCode])

        // restart game for both players
        io.to(roomCode).emit('gameRestarted', {
            rounds: rooms[roomCode].rounds,
            currentRound: 0,
            timer: rooms[roomCode].timer,
            timerDuration: rooms[roomCode].timerDuration,
            roundCount: rooms[roomCode].roundCount
        })
        if (rooms[roomCode].timerDuration === 0) return
        // start timer again
        const interval = setInterval(() => {
            rooms[roomCode].timer -= 1
            io.to(roomCode).emit('timerTick', {
                timer: rooms[roomCode].timer
            })

            if (rooms[roomCode].timer === 0) {
                rooms[roomCode].currentRound += 1

                if (rooms[roomCode].currentRound >= rooms[roomCode].rounds.length) {
                    const winner = rooms[roomCode].players.reduce((a, b) =>
                        a.score > b.score ? a : b
                    )
                    io.to(roomCode).emit('gameOver', {
                        winner: winner.name,
                        players: rooms[roomCode].players
                    })
                    return
                }

                rooms[roomCode].timer = rooms[roomCode].timerDuration
                clearRoundCooldowns(rooms[roomCode])
                io.to(roomCode).emit('cooldownUpdated', { players: rooms[roomCode].players })
                io.to(roomCode).emit('newRound', {
                    currentRound: rooms[roomCode].currentRound
                })
            }
        }, 1000)

        rooms[roomCode].interval = interval
    })




})





server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}
)
