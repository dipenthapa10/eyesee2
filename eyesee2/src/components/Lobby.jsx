import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faCopy, faCrown } from '@fortawesome/free-solid-svg-icons'
import socket from '../socket'
import { ActivityLog } from './ActivityLog'

export const Lobby = ({ playerName, roomCode, isHost, hostId, players, lobbySettings, activities }) => {
    const {
        timer: selectedTimer,
        roundCount: selectedRounds,
        cooldownSeconds: selectedCooldown,
        maxPlayers: selectedMaxPlayers
    } = lobbySettings
    const leaderboardRef = useRef(null)
    const playerPositions = useRef(new Map())
    const copyTimer = useRef(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => () => clearTimeout(copyTimer.current), [])

    const updateSettings = (settings) => {
        socket.emit('updateLobbySettings', {
            roomCode,
            timer: settings.timer,
            roundCount: settings.roundCount,
            cooldownSeconds: settings.cooldownSeconds,
            maxPlayers: settings.maxPlayers
        })
    }

    const handleTimerChange = (timer) => {
        updateSettings({ timer, roundCount: selectedRounds, cooldownSeconds: selectedCooldown, maxPlayers: selectedMaxPlayers })
    }

    const handleRoundsChange = (roundCount) => {
        updateSettings({ timer: selectedTimer, roundCount, cooldownSeconds: selectedCooldown, maxPlayers: selectedMaxPlayers })
    }

    const handleCooldownChange = (cooldownSeconds) => {
        updateSettings({ timer: selectedTimer, roundCount: selectedRounds, cooldownSeconds, maxPlayers: selectedMaxPlayers })
    }

    const handleMaxPlayersChange = (maxPlayers) => {
        updateSettings({ timer: selectedTimer, roundCount: selectedRounds, cooldownSeconds: selectedCooldown, maxPlayers })
    }

    const handleStartGame = () => {

        socket.emit('startGame', {
            roomCode
        })
    }

    const handleCopyRoomCode = async () => {
        if (!roomCode) return

        try {
            await navigator.clipboard.writeText(roomCode)
            setCopied(true)
            clearTimeout(copyTimer.current)
            copyTimer.current = setTimeout(() => setCopied(false), 1600)
        } catch {
            setCopied(false)
        }
    }

    const sortedPlayers = players.filter(player => player.connected !== false).sort((firstPlayer, secondPlayer) => {
        return secondPlayer.score - firstPlayer.score
    })
    const leaderboardState = sortedPlayers.map(player => `${player.id}:${player.score}:${player.connected}`).join('|')

    useLayoutEffect(() => {
        const leaderboard = leaderboardRef.current
        if (!leaderboard) return

        const nextPositions = new Map()
        leaderboard.querySelectorAll('[data-player-id]').forEach((row) => {
            const playerId = row.dataset.playerId
            const nextTop = row.getBoundingClientRect().top
            const previousTop = playerPositions.current.get(playerId)

            if (previousTop !== undefined && previousTop !== nextTop && row.animate) {
                row.animate(
                    [
                        { transform: `translateY(${previousTop - nextTop}px)` },
                        { transform: 'translateY(0)' }
                    ],
                    { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
                )
            }

            nextPositions.set(playerId, nextTop)
        })

        playerPositions.current = nextPositions
    }, [leaderboardState])

    return (
        <div className="lobby-page lobby-layout">
            <header className="lobby-hud app-hud">
                <p className="lobby-logo">EyeSee2</p>
                <span>Rounds: {selectedRounds}</span>
                <span>
                    <FontAwesomeIcon className="timer-icon" icon={faClock} />
                    {selectedTimer === 0 ? 'No Limit' : selectedTimer}
                </span>
            </header>

            <main className="lobby-main">

                <div className="lobby-settings-box">
                    <div className="lobby-room-code-row">
                        <span className="lobby-room-code-label">Room Code</span>
                        <div className="lobby-room-code-value-row">
                            <span className="lobby-room-code-val">{roomCode || '------'}</span>
                            <button
                                className="lobby-copy-icon"
                                onClick={handleCopyRoomCode}
                                disabled={!roomCode}
                                title={copied ? 'Copied!' : 'Copy room code'}
                                aria-label="Copy room code"
                            >
                                <FontAwesomeIcon icon={faCopy} />
                            </button>
                            {copied && <span className="lobby-copied-tooltip" role="status">Copied!</span>}
                        </div>
                    </div>
                    <div className="lobby-setting-row">
                        <span>Players</span>
                        {isHost ? (
                            <select
                                className="lobby-select"
                                value={selectedMaxPlayers}
                                onChange={(e) => handleMaxPlayersChange(Number(e.target.value))}
                            >
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(maxPlayers => (
                                    <option key={maxPlayers} value={maxPlayers}>{maxPlayers}</option>
                                ))}
                            </select>
                        ) : (
                            <span>{selectedMaxPlayers}</span>
                        )}
                    </div>
                    <div className="lobby-setting-row">
                        <span>Rounds</span>
                        {isHost ? (
                            <select
                                className="lobby-select"
                                value={selectedRounds}
                                onChange={(e) => handleRoundsChange(Number(e.target.value))}
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
                                onChange={(e) => handleTimerChange(Number(e.target.value))}
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
                    <div className="lobby-setting-row">
                        <span>Cooldown</span>
                        {isHost ? (
                            <select
                                className="lobby-select"
                                value={selectedCooldown}
                                onChange={(e) => handleCooldownChange(Number(e.target.value))}
                            >
                                <option value={3}>3 sec</option>
                                <option value={4}>4 sec</option>
                                <option value={5}>5 sec</option>
                                <option value={6}>6 sec</option>
                                <option value={7}>7 sec</option>
                                <option value={8}>8 sec</option>
                                <option value={9}>9 sec</option>
                                <option value={10}>10 sec</option>
                            </select>
                        ) : (
                            <span>{selectedCooldown} seconds</span>
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
            </main>

            <aside ref={leaderboardRef} className="lobby-player-sidebar">
                {sortedPlayers.length > 0 ? (
                    sortedPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            data-player-id={player.id}
                            className="leaderboard-row"
                        >
                            <span className="player-rank">#{index + 1}</span>
                            <div className={`lobby-player-box ${player.connected === false ? 'player-inactive' : ''}`}>
                                <div className={`lobby-player-avatar ${index === 1 ? 'p2' : ''}`}>
                                    {player.name[0].toUpperCase()}
                                </div>
                                <div className={`lobby-player-info ${player.id === hostId ? 'lobby-host-info' : ''}`}>
                                    {player.id === hostId ? (
                                        <div className="lobby-host-name-row">
                                            <p className="lobby-player-name">{player.name}</p>
                                            <span className="lobby-player-badge lobby-host-badge" title="Host">
                                                <FontAwesomeIcon icon={faCrown} aria-label="Host" />
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="lobby-player-name">{player.name}</p>
                                    )}
                                    {player.connected === false && <span className="player-status-tag">Left</span>}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="leaderboard-row">
                        <span className="player-rank">#1</span>
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
                    </div>
                )}
            </aside>

            <aside className="lobby-empty-sidebar" aria-label="Activity log">
                <ActivityLog activities={activities} persistentMessage="Waiting for players..." />
            </aside>
        </div>
    )
}
