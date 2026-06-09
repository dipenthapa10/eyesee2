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
            playerName: data.playerName || 'Host'
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
                playerName: data.playerName,
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
        console.log(`game starting in room ${data.roomCode}`)
        io.to(data.roomCode).emit('gameStarted', {
            rounds: rounds,
            currentRound: 0
        })
        const roomCode = data.roomCode
        rooms[roomCode].currentRound = 0
        rooms[data.roomCode].timer = 10

        const interval = setInterval(() => {
            rooms[roomCode].timer -= 1
            io.to(roomCode).emit('timerTick', {
                timer: rooms[roomCode].timer
            })

            if (rooms[roomCode].timer === 0) {
                rooms[roomCode].currentRound += 1

                if (rooms[roomCode].currentRound >= rooms.length) {
                    clearInterval(interval)
                    io.to(roomCode).emit('gameOver', {
                        message: 'Game Over'
                    })
                    return
                }
                // reset timer for next round
                rooms[roomCode].timer = 10

                // tell both players new round started
                io.to(roomCode).emit('newRound', {
                    currentRound: rooms[roomCode].currentRound
                })
            }

        }, 1000)

        // store interval so we can stop it later
        rooms[roomCode].interval = interval
    })

    socket.on('cardMatch', (data) => {
        const roomCode = [...socket.rooms].find(r => r !== socket.id)

        if (!roomCode || !rooms[roomCode]) return

        rooms[roomCode].currentRound += 1

        // no more rounds
        if (rooms[roomCode].currentRound >= rounds.length) {
            clearInterval(rooms[roomCode].interval)
            io.to(roomCode).emit('gameOver', {
                message: 'Game Over!'
            })
            return
        }

        // reset timer for next round
        rooms[roomCode].timer = 10

        io.to(roomCode).emit('matchDone', {
            currentRound: rooms[roomCode].currentRound
        })

        io.to(roomCode).emit('timerTick', {
            timer: rooms[roomCode].timer
        })
    })


})





server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}
)

