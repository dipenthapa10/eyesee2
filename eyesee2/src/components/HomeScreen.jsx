import { useState } from 'react'
import socket from '../socket'

export const HomeScreen = ({ setScreen, setPlayerName, playerName, setRoomCode }) => {
    const [roomCodeLocal, setRoomCodeLocal] = useState("")

    const handleCreateRoom = () => {
        if (!playerName || playerName.trim() === "") {
            alert("please enter your name first!")
            return
        }
        socket.emit('createRoom', { playerName })

    }

    const handleJoinRoom = () => {
        if (!playerName || playerName.trim() === "") {
            alert("please enter your name first!")
            return
        }
        if (!roomCodeLocal || roomCodeLocal.trim() === "") {
            alert("please enter a room code!")
            return
        }
        setRoomCode(roomCodeLocal)
        socket.emit('joinRoom', { playerName, roomCode: roomCodeLocal })
        setScreen("lobby")

    }

    return (
        <div className="home-page">
            <h1 className="home-logo">EyeSee2</h1>
            <p className="home-tagline">spot the match · beat your friends</p>

            <div className="home-card">


                <div>
                    <input
                        className="home-input"
                        placeholder="Enter Your Name "
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                </div>

                <hr className="home-divider" />

                <div>

                    <div className="join-row">
                        <input
                            className="home-input"
                            placeholder="Enter Room Code"
                            value={roomCodeLocal}
                            onChange={(e) => setRoomCodeLocal(e.target.value)}
                        />
                        <button className="btn-join" onClick={handleJoinRoom}>
                            Join
                        </button>
                    </div>
                </div>

                <button className="btn-create" onClick={handleCreateRoom}>
                    + Create Room
                </button>

            </div>

        </div>
    )
}