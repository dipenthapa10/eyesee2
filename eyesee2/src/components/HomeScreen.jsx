import { useState } from 'react'
import socket from '../socket'

export const HomeScreen = ({ setScreen, setPlayerName, playerName }) => {
    const [roomCode, setRoomCode] = useState("")

    const handleCreateRoom = () => {

        if (!playerName || playerName.trim() === "") {
            alert("please enter your game name")
            return
        }
        socket.emit('createRoom', { playerName })
        setScreen("create")
    }

    const handleJoinedRoom = () => {
        console.log("Join button clicked")
        console.log("playerName:", playerName)
        console.log("roomCode:", roomCode)

        if (!playerName || playerName.trim() === "") {
            alert("please enter your game name")
            return
        }

        if (!roomCode || roomCode.trim() === "") {
            alert("please enter room code")
            return
        }
        socket.emit('joinRoom', { playerName, roomCode })
        setScreen("join")
    }

    return (
        <div className="hero-page">
            <h1 className="hero-title" > EYE SEE 2</h1>
            <p className="subtitle"> find two match and beat your friends</p> < br />

            <input
                type='text' placeholder=" Enter Your Name"
                onChange={(e) => setPlayerName(e.target.value)}>
            </input>
            <input
                type="text" placeholder="Enter Room Code"
                value={roomCode} onChange={(e) => setRoomCode(e.target.value)}
            />

            <button onClick={handleJoinedRoom}> Join Room</button>
            <button onClick={handleCreateRoom}> Create Room</button>
        </div>


    )
}