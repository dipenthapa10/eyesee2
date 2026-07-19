import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faCrown } from '@fortawesome/free-solid-svg-icons'
import socket from "../socket";



export const GameScreen = ({ setScreen, rounds, playerName, isHost, hostId, initialPlayers, initialTimer, initialTimerDuration }) => {
    // const defaultTimer = 10;
    const [score, setScore] = useState(0)
    const [message, setMessage] = useState("")
    const [roundIndex, setRoundIndex] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [timer, setTimer] = useState(initialTimer)
    const [timerDuration, setTimerDuration] = useState(initialTimerDuration)
    const [roundLocked, setRoundLocked] = useState(false)
    const [gameStart, setGameStart] = useState(true)
    const [players, setPlayers] = useState(initialPlayers)
    const [winner, setWinner] = useState("")
    const [now, setNow] = useState(Date.now())
    const leaderboardRef = useRef(null)
    const playerPositions = useRef(new Map())





    useEffect(() => {
        const countdownInterval = setInterval(() => setNow(Date.now()), 250)


        socket.on('timerTick', (data) => {
            setTimer(data.timer)
        })

        // listen for new round from server
        socket.on('newRound', (data) => {
            setRoundIndex(data.currentRound)
            setMessage("")
            setRoundLocked(false)
        })

        socket.on('roundWon', (data) => {
            setPlayers(data.players)
            setMessage(`${data.winner} found the match!`)
            setRoundLocked(true)
        })

        // listen for game over from server
        socket.on('gameOver', (data) => {
            setGameOver(true)
            setWinner(data.winner || "")
            setPlayers(data.players || [])

        })

        socket.on('gameRestarted', (data) => {
            setRoundIndex(0)
            setScore(0)
            setMessage("")
            setGameOver(false)
            setTimer(data.timer)
            setTimerDuration(data.timerDuration)
            setWinner("")
            setPlayers([])
            setRoundLocked(false)
        })

        socket.on('scoreUpdated', (data) => {

            setPlayers(data.players)
        })
        socket.on('playerDisconnected', (data) => {
            setPlayers(data.players)
        })
        socket.on('cooldownUpdated', (data) => {
            setPlayers(data.players)
        })
        socket.on('matchDone', (data) => {
            setRoundIndex(data.currentRound)
            setMessage("")
            setRoundLocked(false)
        })
        return () => {
            socket.off('timerTick')
            socket.off('newRound')
            socket.off('roundWon')
            socket.off('gameOver')
            socket.off('gameRestarted')
            socket.off('scoreUpdated')
            socket.off('playerDisconnected')
            socket.off('cooldownUpdated')
            socket.off('matchDone')
            clearInterval(countdownInterval)

        }


    }, [])

    const currentRound = rounds[roundIndex]
    const sortedPlayers = [...players].sort((firstPlayer, secondPlayer) => {
        const connectionOrder = Number(firstPlayer.connected === false) - Number(secondPlayer.connected === false)
        if (connectionOrder !== 0) return connectionOrder

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

    if (!currentRound) return <div> Loading Time...</div>

    const localPlayer = players.find(player => player.id === socket.id)
    const cooldownRemaining = Math.max(0, Math.ceil(((localPlayer?.cooldownUntil || 0) - now) / 1000))

    const handleClick = (symbol) => {
        if (roundLocked || cooldownRemaining > 0) return

        if (symbol === currentRound.match) {
            setMessage("Correct!")
            setScore(score + 1)
            setRoundLocked(true)
            socket.emit('cardMatch', { playerName, symbol, roundIndex })
        } else {
            setMessage("Wrong! Please wait a moment.")
            socket.emit('wrongAnswer', { symbol, roundIndex })
        }
    }

    const restartGame = () => {
        setScore(0)
        setMessage("")
        setRoundIndex(0)
        setGameOver(false)
        socket.emit('restartGame')
    }
    const lobby = () => {
        setRoundIndex(0)
        setScore(0)
        setMessage("")
        setGameOver(false)
        setWinner("")
        setPlayers([])
        setScreen("lobby")
    }


    const centerCard = currentRound.center;
    const yourCard = currentRound.yours;

    const getSizeVariant = (symbol, cardId) => {
        let hash = 0

        for (const character of `${cardId}-${symbol}`) {
            hash = (hash * 31 + character.codePointAt(0)) >>> 0
        }

        return hash % 3
    }

    const getSymbolStyle = (symbol, index, cardId) => {
        // Eight safe zones keep the larger emoji inside the circular card.
        const positions = [
            { x: 50, y: 18, rotation: -20 },
            { x: 77, y: 30, rotation: 25 },
            { x: 82, y: 59, rotation: -35 },
            { x: 65, y: 81, rotation: 18 },
            { x: 35, y: 81, rotation: -28 },
            { x: 17, y: 63, rotation: 38 },
            { x: 21, y: 36, rotation: -32 },
            { x: 50, y: 53, rotation: 15 }
        ]
        const position = positions[index % positions.length]
        const sizeVariants = index === 7 ? [2.7, 3.2, 3.7] : [2.1, 2.7, 3.3]
        const size = sizeVariants[getSizeVariant(symbol, cardId)]

        return {
            left: `${position.x}%`,
            top: `${position.y}%`,
            fontSize: `${size}rem`,
            lineHeight: 1,
            transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`
        }
    }

    const playerList = (
        <section ref={leaderboardRef} className="game-player-list" aria-label="Players">
            {sortedPlayers.length > 0 ? (
                sortedPlayers.map((p, i) => (
                    <div key={p.id} data-player-id={p.id} className="leaderboard-row">
                        <span className="player-rank">#{i + 1}</span>
                        <div className={`lobby-player-box ${p.connected === false ? 'player-inactive' : ''} ${p.cooldownUntil > now ? 'player-cooldown' : ''}`}>
                            <div className={`lobby-player-avatar ${i === 1 ? 'p2' : ''}`}>
                                {p.name[0].toUpperCase()}
                            </div>
                            <div className="lobby-player-info">
                                <div className="game-player-name-row">
                                    <p className="lobby-player-name">{p.name}</p>
                                    {p.id === hostId && (
                                        <span className="lobby-host-badge" title="Host">
                                            <FontAwesomeIcon icon={faCrown} aria-label="Host" />
                                        </span>
                                    )}
                                </div>
                                {p.connected === false && <span className="player-status-tag">Left</span>}
                            </div>
                            <span className="lobby-player-badge">{p.score}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="leaderboard-row">
                    <span className="player-rank">#1</span>
                    <div className="lobby-player-box">
                        <div className="lobby-player-avatar">
                            {playerName ? playerName[0].toUpperCase() : 'P'}
                        </div>
                        <div className="lobby-player-info">
                            <div className="game-player-name-row">
                                <p className="lobby-player-name">{playerName}</p>
                                {isHost && (
                                    <span className="lobby-host-badge" title="Host">
                                        <FontAwesomeIcon icon={faCrown} aria-label="Host" />
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="lobby-player-badge">{score}</span>
                    </div>
                </div>
            )}
        </section>
    )






    return (
        <div className="game-page">
            <header className="game-hud app-hud">
                <p className="lobby-logo">EyeSee2</p>
                <span>Round: {roundIndex + 1} / {rounds.length}</span>
                <span>
                    <FontAwesomeIcon className="timer-icon" icon={faClock} />
                    {timerDuration === 0 ? 'No Limit' : timer}
                </span>
            </header>
            <aside className="game-player-sidebar">
                {playerList}
            </aside>
            <main className="game-main">
                {message && !gameOver && (
                    <div className="game-round-message">
                        <p>{message}</p>
                    </div>
                )}

                {!gameOver && (
                    <div className="game-cards-area">
                        <div className="card">
                            {centerCard.map((symbol, index) => (
                                <span
                                    className="symbol"
                                    key={symbol}
                                    style={getSymbolStyle(symbol, index, centerCard.join(''))}
                                    onClick={() => handleClick(symbol)}
                                >
                                    {symbol}
                                </span>
                            ))}
                        </div>

                        <div className="card your-card">
                            {yourCard.map((symbol, index) => (
                                <span
                                    className="symbol"
                                    key={symbol}
                                    style={getSymbolStyle(symbol, index, yourCard.join(''))}
                                    onClick={() => handleClick(symbol)}
                                >
                                    {symbol}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {gameOver && (
                    <div className="game-over-box">
                        <h1>🏆 {winner} wins!</h1>
                        <button className="lobby-btn-start" onClick={isHost ? restartGame : undefined}>
                            Play Again
                        </button>
                        <button className="lobby-btn-start" onClick={lobby}>
                            Lobby
                        </button>
                    </div>
                )}
            </main>

            <aside className="game-sidebar" aria-label="Future chat panel" />
        </div>
    )
}
