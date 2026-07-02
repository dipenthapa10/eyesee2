import { useState, useEffect } from "react"
import socket from "../socket";



export const GameScreen = ({ setScreen, rounds, roomCode, playerName }) => {
    const defaultTimer = 10;
    const [score, setScore] = useState(0)
    const [message, setMessage] = useState("")
    const [roundIndex, setRoundIndex] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [timer, setTimer] = useState(defaultTimer)
    const [gameStart, setGameStart] = useState(true)
    const [players, setPlayers] = useState([])
    const [winner, setWinner] = useState("")



    useEffect(() => {
        socket.on('matchDone', (data) => {
            setRoundIndex(data.currentRound)
        })

        return () => socket.off('matchDone')
    }, [])

    useEffect(() => {
        socket.on('timerTick', (data) => {
            setTimer(data.timer)
        })

        // listen for new round from server
        socket.on('newRound', (data) => {
            setRoundIndex(data.currentRound)
            setMessage("")
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
            setTimer(10)
            setWinner("")
            setPlayers([])
        })

        socket.on('scoreUpdated', (data) => {

            setPlayers(data.players)
        })
        return () => {
            socket.off('timerTick')
            socket.off('newRound')
            socket.off('gameOver')
            socket.off('gameRestarted')
            socket.off('scoreUpdated')
        }

    }, [])

    const currentRound = rounds[roundIndex]

    if (!currentRound) return <div> Loading Time...</div>

    const handleClick = (symbol) => {
        if (symbol === currentRound.match) {
            setMessage("Correct!")
            setScore(score + 1)
            socket.emit('cardMatch', { playerName })
        } else {
            setMessage("Wrong!")
        }
    }

    const restartGame = () => {
        setScore(0)
        setMessage("")
        setRoundIndex(0)
        setGameOver(false)
        socket.emit('restartGame')
    }


    const centerCard = currentRound.center;
    const yourCard = currentRound.yours;

    const getSymbolStyle = (index, total) => {
        const angle = (index / total) * 2 * Math.PI
        const radius = 28 + (index % 3) * 8
        const x = 50 + radius * Math.cos(angle)
        const y = 50 + radius * Math.sin(angle)
        const rotations = [-30, 15, -45, 20, -15, 40, -25, 30]
        const sizes = [1.8, 1.4, 2.0, 1.6, 1.9, 1.5, 2.1, 1.7]
        return {
            left: `${x}%`,
            top: `${y}%`,
            fontSize: `${sizes[index % sizes.length]}rem`,
            transform: `translate(-50%, -50%) rotate(${rotations[index % rotations.length]}deg)`
        }
    }







    return (
        <div className="lobby-page">
            {/* LEFT - cards */}
            <div className="lobby-left">
                <p className="lobby-logo">EyeSee2</p>

                <div className="lobby-round-timer">
                    <span>Round: {roundIndex + 1} / {rounds.length}</span>
                    <span>Timer: {timer}s</span>
                </div>

                {!gameOver && (
                    <div className="game-cards-area">
                        <div className="card">
                            {centerCard.map((symbol, index) => (
                                <span
                                    className="symbol"
                                    key={symbol}
                                    style={getSymbolStyle(index, centerCard.length)}
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
                                    style={getSymbolStyle(index, yourCard.length)}
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
                        <button className="lobby-btn-start" onClick={restartGame}>
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT - players same as lobby */}
            <div className="lobby-right">
                {players.length > 0 ? (
                    players.map((p, i) => (
                        <div key={p.id} className="lobby-player-box">
                            <div className={`lobby-player-avatar ${i === 1 ? 'p2' : ''}`}>
                                {p.name[0].toUpperCase()}
                            </div>
                            <div className="lobby-player-info">
                                <p className="lobby-player-name">{p.name}</p>
                            </div>
                            <span className="lobby-player-badge">{p.score} pts</span>
                        </div>
                    ))
                ) : (
                    <div className="lobby-player-box">
                        <div className="lobby-player-avatar">
                            {playerName ? playerName[0].toUpperCase() : 'P'}
                        </div>
                        <div className="lobby-player-info">
                            <p className="lobby-player-name">{playerName}</p>
                        </div>
                        <span className="lobby-player-badge">{score} pts</span>
                    </div>
                )}

                {message && (
                    <div className="game-message-box">
                        <p className="game-message-text">{message}</p>
                    </div>
                )}
            </div>
        </div>
    )
}