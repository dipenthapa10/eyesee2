import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCrown } from '@fortawesome/free-solid-svg-icons'
import socket from '../socket'

export const Lobby = ({ playerName, roomCode, isHost, players }) => {
    const [selectedTimer, setSelectedTimer] = useState(0)
    const [selectedRounds, setSelectedRounds] = useState(15)

    const handleStartGame = () => {

        socket.emit('startGame', {
            roomCode,
            timer: selectedTimer,
            roundCount: selectedRounds
        })
    }

    return (
        <div className="lobby-page">
            <div className="lobby-left">
                <p className="lobby-logo">EyeSee2</p>

                <div className="lobby-round-timer">
                    <span>Round: {selectedRounds} </span>
                    <span>Timer: {selectedTimer === 0 ? 'No Limit' : selectedTimer} </span>
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
                        {isHost ? (
                            <select
                                className="lobby-select"
                                value={selectedRounds}
                                onChange={(e) => setSelectedRounds(Number(e.target.value))}
                            >
                                <option value={10}>10 rounds</option>
                                <option value={11}>11 rounds</option>
                                <option value={12}>12 rounds</option>
                                <option value={13}>13 rounds</option>
                                <option value={14}>14 rounds</option>
                                <option value={15}>15 rounds</option>
                                <option value={16}>16 rounds</option>
                                <option value={17}>17 rounds</option>
                                <option value={18}>18 rounds</option>
                                <option value={19}>19 rounds</option>
                                <option value={20}>20 rounds</option>
                            </select>
                        ) : (
                            <span>{selectedRounds} rounds</span>
                        )}

                    </div>
                    <div className="lobby-setting-row">
                        <span>Timer</span>
                        {isHost ? (
                            <select
                                className="lobby-select"
                                value={selectedTimer}
                                onChange={(e) => setSelectedTimer(Number(e.target.value))}
                            >
                                <option value={0}>No Time Limit</option>
                                <option value={5}>5 sec</option>
                                <option value={10}>10 sec</option>
                                <option value={15}>15 sec</option>
                            </select>
                        ) : (
                            <span>
                                {selectedTimer === 0
                                    ? "No Time Limit"
                                    : `${selectedTimer} Seconds`}
                            </span>
                        )}
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
                        <div className="lobby-player-info lobby-host-info">
                            <div className="lobby-host-name-row">
                                <p className="lobby-player-name">{players[0].name}</p>
                                <span className="lobby-player-badge lobby-host-badge" title="Host">
                                    <FontAwesomeIcon icon={faCrown} aria-label="Host" />
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lobby-player-box">
                        <div className="lobby-player-avatar">
                            {playerName ? playerName[0].toUpperCase() : 'H'}
                        </div>
                        <div className="lobby-player-info lobby-host-info">
                            <div className="lobby-host-name-row">
                                <p className="lobby-player-name">{playerName || 'Host'}</p>
                                <span className="lobby-player-badge lobby-host-badge" title="Host">
                                    <FontAwesomeIcon icon={faCrown} aria-label="Host" />
                                </span>
                            </div>
                            <p className="lobby-player-sub">room host</p>
                        </div>
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
