import { useState } from 'react'
import socket from '../socket'
import gameLogo from '../assets/logo.png'

export const HomeScreen = ({ setPlayerName, playerName, setRoomCode, joinError, clearJoinError }) => {
    const [roomCodeLocal, setRoomCodeLocal] = useState("")

    const handleCreateRoom = () => {
        if (!playerName || playerName.trim() === "") {
            alert("please enter your name first!")
            return
        }
        clearJoinError()
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
        clearJoinError()
        socket.emit('joinRoom', { playerName, roomCode: roomCodeLocal })

    }

    return (
        <div className="home-page">
            <img className="home-game-mark" src={gameLogo} alt="EyeSee2 game logo" />
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

            {joinError && (
                <div className="home-error-overlay" role="presentation">
                    <section className="home-error-modal" role="alertdialog" aria-modal="true" aria-labelledby="join-error-title">
                        <h2 id="join-error-title">Oops!</h2>
                        <p>{joinError === 'This room is full.' ? 'Room is full!' : joinError}</p>
                        <button className="home-error-confirm" onClick={clearJoinError}>Okay!</button>
                    </section>
                </div>
            )}

        </div>
    )
}
