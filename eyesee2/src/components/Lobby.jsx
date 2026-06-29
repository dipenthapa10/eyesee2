import { useState, useEffect } from 'react'
import socket from '../socket'

export const Lobby = ({ setScreen, playerName, roomCode, isHost }) => {
    const [players, setPlayers] = useState([])

    useEffect(() => {
        socket.on('roomCreated', (data) => {
            setPlayers(data.players)
        })

        socket.on('playerJoined', (data) => {
            setPlayers(data.players)

        })
        socket.on('joinError', (data) => {
            console.log("joinError received!", data)
            setError(data.message)
        })

        return () => {
            socket.off('roomCreated')
            socket.off('playerJoined')
            socket.off('joinError')
        }
    }, [])

    const handleStartGame = () => {

        socket.emit('startGame', { roomCode })
    }

    return (
        <div className="lobby-page">
            <div className="lobby-left">
                <p className="lobby-logo">EyeSee2</p>

                <div className="lobby-round-timer">
                    <span>Round: </span>
                    <span>Timer: </span>
                </div>

                <div className="lobby-settings-box">
                    <div className="lobby-room-code-row">
                        <span className="lobby-room-code-label">Room Code</span>
                        <span className="lobby-room-code-val">{roomCode || '------'}</span>
                    </div>
                    <div className="lobby-setting-row">
                        <span>Players</span>

                    </div>
                    <div className="lobby-setting-row">
                        <span>Characters</span>

                    </div>
                    <div className="lobby-setting-row">
                        <span>Rounds</span>

                    </div>
                    <div className="lobby-setting-row">
                        <span>Timer</span>

                    </div>
                </div>

                {isHost ? (
                    <button className="lobby-btn-start" onClick={handleStartGame}>
                        Start Game
                    </button>
                ) : (
                    <div className="lobby-waiting">
                        Waiting for host to start...
                    </div>
                )}


            </div>

            <div className="lobby-right">
                {players[0] ? (
                    <div className="lobby-player-box">
                        <div className="lobby-player-avatar">
                            {players[0].name[0].toUpperCase()}
                        </div>
                        <div className="lobby-player-info">
                            <p className="lobby-player-name">{players[0].name}</p>

                        </div>
                        <span className="lobby-player-badge">Host </span>
                    </div>
                ) : (
                    <div className="lobby-player-box">
                        <div className="lobby-player-avatar">
                            {playerName ? playerName[0].toUpperCase() : 'H'}
                        </div>
                        <div className="lobby-player-info">
                            <p className="lobby-player-name">{playerName || 'Host'}</p>
                            <p className="lobby-player-sub">room host</p>
                        </div>
                        <span className="lobby-player-badge">Host </span>
                    </div>
                )}

                {players.length > 1 && (
                    <div className="lobby-player-box">
                        <div className="lobby-player-avatar p2">
                            {players[1].name[0].toUpperCase()}
                        </div>
                        <div className="lobby-player-info">
                            <p className="lobby-player-name">{players[1].name}</p>

                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}