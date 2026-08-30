import { useState } from 'react'
import socket from '../socket'
import gameLogo from '../assets/logo.png'
import { creatures } from '../creatures'

export const HomeScreen = ({ setPlayerName, playerName, setRoomCode, joinError, clearJoinError }) => {
    const sharedRoomCode = new URLSearchParams(window.location.search).get('room')?.trim().toUpperCase() || ''
    const [roomCodeLocal, setRoomCodeLocal] = useState(() => sharedRoomCode)
    const [selectedCreatureId, setSelectedCreatureId] = useState(() =>
        creatures.find(creature => creature.id === 'cre4')?.id || creatures[0]?.id || ''
    )
    const selectedCreature = creatures.find(creature => creature.id === selectedCreatureId) || creatures[0]
    const selectedCreatureIndex = creatures.findIndex(creature => creature.id === selectedCreature?.id)

    const changeCreature = (direction) => {
        if (creatures.length === 0) return

        const nextIndex = (selectedCreatureIndex + direction + creatures.length) % creatures.length
        setSelectedCreatureId(creatures[nextIndex].id)
    }

    const handleCreateRoom = () => {
        if (!playerName || playerName.trim() === "") {
            alert("please enter your name first!")
            return
        }
        clearJoinError()
        socket.emit('createRoom', { playerName, creatureId: selectedCreature?.id })

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
        const roomCode = roomCodeLocal.trim().toUpperCase()
        setRoomCode(roomCode)
        clearJoinError()
        socket.emit('joinRoom', { playerName, roomCode, creatureId: selectedCreature?.id })

    }

    return (
        <div className="home-page">
            <img className="home-game-mark" src={gameLogo} alt="EyeSee2 game logo" />
            <h1 className="home-logo">EyeSee2</h1>
            <p className="home-tagline">get your eye to see twoooooooo</p>

            <div className="home-card">


                <div>
                    <input
                        className="home-input"
                        placeholder="Enter Your Name "
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                </div>

                <div className="home-character-preview">
                    <button
                        type="button"
                        className="creature-arrow"
                        onClick={() => changeCreature(-1)}
                        aria-label="Previous character"
                    >
                        ‹
                    </button>
                    {selectedCreature && <img src={selectedCreature.imageUrl} alt="Your selected character" />}
                    <button
                        type="button"
                        className="creature-arrow"
                        onClick={() => changeCreature(1)}
                        aria-label="Next character"
                    >
                        ›
                    </button>
                </div>


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
