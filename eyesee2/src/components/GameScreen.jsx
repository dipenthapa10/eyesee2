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
            setMessage("✅ Correct!")
            setScore(score + 1)
            socket.emit('cardMatch', { playerName })
        } else {
            setMessage("❌ Wrong!")
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
        <div className="game-screen">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button className=" block mr-auto px-4 py-2 bg-rounded-600 rounded-lg text-white hover:bg-purple-700 " onClick={() => setScreen("home")}>back</button>

                <div className="flex gap-8 justify-center">
                    {players.map(player => (
                        <div key={player.id}>
                            <p>{player.name}</p>
                            <p>{player.score}</p>
                        </div>
                    ))}
                </div>
                <p className="m-0 text-gray-400" >{message} </p>
                {!gameOver && <p>Timer: {timer}</p>}
            </div>
            {!gameOver && (<>
                {gameStart && (<>
                    <h2>Card 1</h2>
                    <div className="card">
                        {centerCard.map((symbol, index) => (
                            <span className="symbol"
                                key={symbol} style={getSymbolStyle(index, centerCard.length)} onClick={() => handleClick(symbol)}
                            >
                                {symbol}
                            </span>))}
                    </div>


                    <h2>Card 2</h2>
                    <div className="card your-card">
                        {yourCard.map((symbol, index) => (
                            <span className="symbol" key={symbol} style={getSymbolStyle(index, centerCard.length)} onClick={() => handleClick(symbol)}>
                                {symbol}
                            </span>
                        ))}
                    </div>
                </>)}

            </>)}

            {gameOver && (
                <div>
                    <h1>🏆 {winner} wins!</h1>
                    {players.map(p => (
                        <p key={p.id}>{p.name}: {p.score}</p>
                    ))}
                    <button onClick={restartGame}>Play Again</button>
                </div>
            )}

        </div>
    )
}