const express = require('express')
const app = express()
const PORT = 3001

//middleware
app.use(express.json()) //server read json
app.use(express.urlencoded({ extended: true }))

const rooms = {}

const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = '';
    for (let i = 0; i < 6; ++i) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

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


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}
)

