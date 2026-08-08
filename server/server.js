const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')


const allowedOrigins = [
    'http://localhost:5173',
    process.env.CLIENT_URL
].filter(Boolean)

const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
}
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: corsOptions
})


//middleware
app.use(cors(corsOptions))
app.use(express.json()) //server read json
app.use(express.urlencoded({ extended: true })) // server read from data

//setup for static folder  ( yet to do)  
const PORT = process.env.PORT || 3001
const rooms = {}
const ROUND_RESULT_DELAY = 900
const RESULT_SCREEN_DURATION = 15_000

const clearRoundCooldowns = (room) => {
    room.players.forEach(player => {
        delete player.cooldownUntil
        delete player.correctUntil
    })
}

const withLobbyStatus = (room, returnedPlayerIds) => room.players.map(player => ({
    ...player,
    inLobby: returnedPlayerIds.has(player.id)
}))

const roomPlayersForClients = (room) => room.phase === 'results'
    ? withLobbyStatus(room, room.resultLobbyPlayerIds || new Set())
    : room.players

const broadcastRoomState = (roomCode, room) => {
    io.to(roomCode).emit('roomStateUpdated', {
        roomCode,
        players: roomPlayersForClients(room),
        hostId: room.hostId,
        settings: room.settings,
        phase: room.phase
    })
}

const returnRoomToLobby = (roomCode, room) => {
    clearInterval(room.interval)
    clearTimeout(room.resultTimer)
    room.gameStarted = false
    room.phase = 'lobby'
    room.currentRound = 0
    room.rounds = []
    room.roundLocked = false
    clearRoundCooldowns(room)
    room.players = room.players.filter(player => player.connected !== false)

    if (room.players.length === 0) {
        delete rooms[roomCode]
        return
    }

    room.players.forEach(player => { player.score = 0 })

    const earlyLobbyPlayerIds = room.resultLobbyPlayerIds || new Set()
    const playersReturningAfterResults = room.players.filter(player => !earlyLobbyPlayerIds.has(player.id))

    io.to(roomCode).emit('returnedToLobby', {
        roomCode,
        players: withLobbyStatus(room, new Set(room.players.map(player => player.id))),
        hostId: room.hostId,
        settings: room.settings
    })

    playersReturningAfterResults.forEach(player => {
        io.to(roomCode).emit('activityUpdate', {
            id: player.id,
            name: player.name,
            type: 'notice',
            message: 'joined the room.',
            timestamp: Date.now()
        })
    })

    delete room.resultLobbyPlayerIds
}

const sendEarlyLobbyState = (roomCode, room) => {
    const playersWithLobbyStatus = withLobbyStatus(room, room.resultLobbyPlayerIds)

    room.resultLobbyPlayerIds.forEach(playerId => {
        io.to(playerId).emit('returnedToLobby', {
            roomCode,
            players: playersWithLobbyStatus,
            hostId: room.hostId,
            settings: room.settings
        })
    })
}

const finishGame = (roomCode, room) => {
    clearInterval(room.interval)
    room.phase = 'results'
    room.roundLocked = true
    clearRoundCooldowns(room)
    room.resultLobbyPlayerIds = new Set()

    const winner = room.players.reduce((firstPlayer, secondPlayer) =>
        firstPlayer.score >= secondPlayer.score ? firstPlayer : secondPlayer
    )

    io.to(roomCode).emit('gameOver', {
        winner: winner.name,
        players: room.players
    })

    clearTimeout(room.resultTimer)
    room.resultTimer = setTimeout(() => {
        if (rooms[roomCode] !== room) return
        returnRoomToLobby(roomCode, room)
    }, RESULT_SCREEN_DURATION)
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
            phase: 'lobby',
            currentRound: 0,
            settings: { timer: 0, roundCount: 23, cooldownSeconds: 5, maxPlayers: 3 },
            deck: []
        };

        socket.join(roomCode)
        socket.data.roomCode = roomCode
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

        const roomCode = String(data.roomCode || '').trim().toUpperCase()

        console.log("joinRoom received on server:", data)
        console.log("rooms available:", Object.keys(rooms))
        console.log("looking for room:", roomCode)
        console.log("room exists?", !!rooms[roomCode])

        if (rooms[roomCode]) {
            const room = rooms[roomCode]
            if (room.phase !== 'lobby') {
                socket.emit("joinError", { message: "Please wait for the game to return to the lobby." })
                return
            }

            if (room.players.filter(player => player.connected !== false).length >= room.settings.maxPlayers) {
                socket.emit("joinError", { message: "This room is full." })
                return
            }

            const player = {
                id: socket.id,
                name: data.playerName,
                score: 0
            }
            room.players.push(player)

            socket.join(roomCode)
            socket.data.roomCode = roomCode
            console.log(`new player has joined the room ${roomCode}`)

            broadcastRoomState(roomCode, room)
            io.to(roomCode).emit('playerJoined', {
                players: room.players,
                hostId: room.hostId,
                roomCode,
                settings: room.settings
            })
            io.to(roomCode).emit('activityUpdate', {
                id: player.id,
                name: player.name,
                type: 'notice',
                message: 'joined the room.',
                timestamp: Date.now()
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

        const roomCode = socket.data.roomCode || [...socket.rooms].find(room => room !== socket.id)
        const room = rooms[roomCode]

        if (!room) return

        if (room.hostId !== socket.id) {
            const player = room.players.find(existingPlayer => existingPlayer.id === socket.id)
            if (!player) return

            if (room.phase === 'playing') {
                player.connected = false
            } else {
                room.players = room.players.filter(existingPlayer => existingPlayer.id !== socket.id)
                room.resultLobbyPlayerIds?.delete(socket.id)
            }

            io.to(roomCode).emit('playerDisconnected', {
                players: roomPlayersForClients(room),
                playerId: socket.id
            })
            broadcastRoomState(roomCode, room)
            io.to(roomCode).emit('activityUpdate', {
                id: player.id,
                name: player.name,
                type: 'notice',
                message: 'left the room.',
                timestamp: Date.now()
            })

            if (room.phase === 'results') {
                sendEarlyLobbyState(roomCode, room)
            }
            return
        }

        // A game cannot continue without its host. Stop its timer before
        // returning the remaining players to the lobby.
        clearInterval(room.interval)
        clearTimeout(room.resultTimer)
        room.gameStarted = false
        room.phase = 'lobby'
        delete room.resultLobbyPlayerIds
        const departingHost = room.players.find(player => player.id === socket.id)
        room.players = room.players.filter(
            player => player.id !== socket.id && player.connected !== false
        )

        if (room.players.length === 0) {
            delete rooms[roomCode]
            return
        }

        // Promote the next connected player so the room can be started again.
        const nextHost = room.players[0]
        room.hostId = nextHost.id

        io.to(roomCode).emit('hostDisconnected', {
            roomCode,
            players: room.players,
            hostId: room.hostId
        })
        broadcastRoomState(roomCode, room)
        io.to(roomCode).emit('activityUpdate', {
            id: departingHost?.id || socket.id,
            name: departingHost?.name || 'The host',
            type: 'notice',
            message: 'left the room.',
            timestamp: Date.now()
        })

        room.players.forEach(player => {
            const isNewHost = player.id === nextHost.id

            io.to(player.id).emit('activityUpdate', {
                id: nextHost.id,
                name: isNewHost ? 'You' : nextHost.name,
                type: 'notice',
                message: isNewHost ? 'are now the host.' : 'is now the host.',
                timestamp: Date.now()
            })
        })
    })

    socket.on('updateLobbySettings', (data) => {
        const room = rooms[data.roomCode]
        if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return

        const timer = Number(data.timer)
        const roundCount = Number(data.roundCount)
        const cooldownSeconds = Number(data.cooldownSeconds)
        const maxPlayers = Number(data.maxPlayers)

        if (![0, 5, 10, 15].includes(timer)) return
        if (!Number.isInteger(roundCount) || (roundCount !== 1 && (roundCount < 10 || roundCount > 30))) return
        if (!Number.isInteger(cooldownSeconds) || cooldownSeconds < 3 || cooldownSeconds > 10) return
        if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 10) return
        if (room.players.length > maxPlayers) return

        room.settings = { timer, roundCount, cooldownSeconds, maxPlayers }
        io.to(data.roomCode).emit('lobbySettingsUpdated', { settings: room.settings })
    })

    socket.on('returnToLobby', () => {
        const roomCode = [...socket.rooms].find(roomId => roomId !== socket.id)
        const room = rooms[roomCode]
        if (!room || room.phase !== 'results' || !room.resultLobbyPlayerIds) return

        room.resultLobbyPlayerIds.add(socket.id)

        // If every active player has already left the results screen, there
        // is no reason to keep the room in its 15-second results phase. Move
        // the room back to the real lobby now so the host can start again.
        const everyoneReturned = room.players
            .filter(player => player.connected !== false)
            .every(player => room.resultLobbyPlayerIds.has(player.id))

        if (everyoneReturned) {
            returnRoomToLobby(roomCode, room)
            return
        }

        sendEarlyLobbyState(roomCode, room)
    })

    socket.on('startGame', (data) => {
        const roomCode = data.roomCode
        const room = rooms[roomCode]
        if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return
        clearTimeout(room.resultTimer)
        room.players.forEach(p => p.score = 0)
        clearRoundCooldowns(room)

        const timerDuration = room.settings.timer
        room.gameStarted = true
        room.phase = 'playing'
        room.roundLocked = false
        room.currentRound = 0
        room.timerDuration = timerDuration
        room.timer = timerDuration

        const roundCount = room.settings.roundCount
        const safeRoundCount = roundCount === 1 ? 1 : Math.min(Math.max(roundCount, 10), 30)
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
                    finishGame(roomCode, room)
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
                finishGame(roomCode, room)
                return
            }

            room.timer = room.timerDuration
            room.roundLocked = false
            io.to(roomCode).emit('matchDone', {
                currentRound: room.currentRound,
                timer: room.timer
            })
            io.to(roomCode).emit('timerTick', { timer: room.timer })

            // The client takes 60ms to remove the old cards. Keep the green
            // winner state through that moment, then clear it for the new round.
            setTimeout(() => {
                if (!rooms[roomCode] || room.currentRound !== data.roundIndex + 1) return

                clearRoundCooldowns(room)
                io.to(roomCode).emit('cooldownUpdated', { players: room.players })
            }, 75)

            if (room.timerDuration === 0) return

            room.interval = setInterval(() => {
                room.timer -= 1
                io.to(roomCode).emit('timerTick', { timer: room.timer })

                if (room.timer !== 0) return

                room.currentRound += 1

                if (room.currentRound >= room.rounds.length) {
                    finishGame(roomCode, room)
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

    socket.on('sendChatMessage', (data) => {
        const roomCode = socket.data.roomCode
        const room = rooms[roomCode]
        const player = room?.players.find((player) => player.id === socket.id)
        const text = String(data?.text || '').trim()

        if (!room || !player || !text) return

        io.to(roomCode).emit('chatMessage', {
            id: `${socket.id}-${Date.now()}`,
            name: player.name,
            text: text.slice(0, 140),
            timestamp: Date.now()
        })
    })


})





server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}
)
