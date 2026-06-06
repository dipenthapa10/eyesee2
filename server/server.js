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
                playerName: data.playerName
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
})

app.get('/', (req, res) => {
    res.send('eyesee2 server is running')
})

app.get('/createroom', (req, res) => {
    const roomCode = generateRoomCode()
    rooms[roomCode] = {
        players: [],
        gameStarted: false
    }
    res.json({ roomCode })

})

app.get('/joinroom/:code', (req, res) => {
    const code = req.params.code

    if (rooms[code]) {
        res.json({ success: true, message: 'room found' })
    } else {
        res.json({ success: false, message: 'room not found' })
    }
})


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}
)

