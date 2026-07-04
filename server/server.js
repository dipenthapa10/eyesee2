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

// game data
const { rounds } = require('./gameData')

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
            deck: []
        };

        socket.join(roomCode)
        console.log(`room ${roomCode} successfully created by ${socket.id}`)

        socket.emit('roomCreated', {
            roomCode,
            players: rooms[roomCode].players,
            hostId: rooms[roomCode].hostId

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
                roomCode: data.roomCode
            })
        }
        else {
            socket.emit("joinError", { message: "Room Not Found" })
        }
    })


    //when player disconnects 
    socket.on('disconnect', () => {
        console.log('player disconnects:', socket.id)
    })

    socket.on('startGame', (data) => {
        const roomCode = data.roomCode
        const room = rooms[roomCode]
        if (!room) return
        room.players.forEach(p => p.score = 0)

        const timerDuration = Number(data.timer) || 0
        room.gameStarted = true
        room.currentRound = 0
        room.timerDuration = timerDuration
        room.timer = timerDuration

        io.to(roomCode).emit('gameStarted', {
            rounds,
            currentRound: 0,
            timer: room.timer,
            timerDuration: room.timerDuration
        })

        if (timerDuration === 0) return

        room.interval = setInterval(() => {
            room.timer -= 1

            io.to(roomCode).emit('timerTick', {
                timer: room.timer
            })

            if (room.timer === 0) {
                room.currentRound += 1

                if (room.currentRound >= rounds.length) {
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

                io.to(roomCode).emit('newRound', {
                    currentRound: room.currentRound,
                    timer: room.timer
                })
            }
        }, 1000)
    })

    socket.on('cardMatch', (data) => {
        const roomCode = [...socket.rooms].find(r => r !== socket.id)

        if (!roomCode || !rooms[roomCode]) return

        const player = rooms[roomCode].players.find(p => p.id === socket.id)
        if (player) player.score += 1

        rooms[roomCode].currentRound += 1

        // no more rounds
        if (rooms[roomCode].currentRound >= rounds.length) {
            clearInterval(rooms[roomCode].interval)

            const winner = rooms[roomCode].players.reduce((a, b) =>
                a.score > b.score ? a : b)


            io.to(roomCode).emit('gameOver', {
                winner: winner.name,
                players: rooms[roomCode].players
            })
            return
        }

        // reset timer for next round
        rooms[roomCode].timer = rooms[roomCode].timerDuration

        io.to(roomCode).emit('matchDone', {
            currentRound: rooms[roomCode].currentRound,
            timer: rooms[roomCode].timer
        })

        io.to(roomCode).emit('timerTick', {
            timer: rooms[roomCode].timer
        })

        io.to(roomCode).emit('scoreUpdated', {
            players: rooms[roomCode].players
        })
    })

    socket.on('restartGame', () => {
        const roomCode = [...socket.rooms].find(r => r !== socket.id)
        if (!roomCode || !rooms[roomCode]) return

        // stop old timer
        clearInterval(rooms[roomCode].interval)

        // reset room state
        rooms[roomCode].currentRound = 0
        rooms[roomCode].timer = rooms[roomCode].timerDuration
        rooms[roomCode].players.forEach(p => p.score = 0)

        // restart game for both players
        io.to(roomCode).emit('gameRestarted', {
            rounds: rounds,
            currentRound: 0,
            timer: rooms[roomCode].timer,
            timerDuration: rooms[roomCode].timerDuration
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

                if (rooms[roomCode].currentRound >= rounds.length) {
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
