import { useState, useEffect } from "react"




export const GameScreen = ({ setScreen }) => {
    const defaultTimer = 10;
    const [score, setScore] = useState(0)
    const [message, setMessage] = useState("")
    const [roundIndex, setRoundIndex] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [timer, setTimer] = useState(defaultTimer)
    const [gameStart, setGameStart] = useState(false)


    const rounds = [
        {
            center: ["🍎", "🍌", "🎯", "🎲", "🧩", "🚗", "🚀", "🛸"],
            yours: ["🍇", "🍌", "👻", "👑", "🍕", "🎸", "⚽️", "🌙"],
            match: "🍌"
        },
        {
            center: ["🐱", "💡", "🎨", "🏀", "🌙", "🍀", "💎", "🎁"],
            yours: ["🐶", "🔥", "🐱", "⚓️", "💣", "🎈", "🌵", "🕶️"],
            match: "🐱"
        },
        {
            center: ["🚀", "🌋", "🐙", "🎩", "🍉", "🔮", "🛎️", "🦉"],
            yours: ["🍩", "🌵", "🎯", "🔥", "🦉", "👽", "🤖", "💧"],
            match: "🦉"
        },
        {
            center: ["💎", "🐝", "🌸", "🚗", "🍿", "👑", "🦖", "☀️"],
            yours: ["🎸", "🌲", "💎", "🤠", "⏰", "🛸", "🔑", "🍦"],
            match: "💎"
        },
        {
            center: ["🔥", "🍇", "🤖", "🎈", "🌊", "🐶", "🏔️", "🕶️"],
            yours: ["🔥", "💡", "🎁", "🦋", "🍎", "🧩", "👻", "🌙"],
            match: "🔥"
        },
        {
            center: ["👻", "🍕", "🌲", "🎯", "🐝", "💣", "🤠", "🔮"],
            yours: ["🏀", "👻", "🦖", "⚡️", "🍌", "🎨", "🛎️", "🌋"],
            match: "👻"
        },
        {
            center: ["⚽️", "🍀", "🔑", "🦉", "🍩", "🤖", "🌸", "🎩"],
            yours: ["⚽️", "🐙", "💧", "🎲", "👽", "🍉", "☀️", "🚀"],
            match: "⚽️"
        },
        {
            center: ["🌙", "🐶", "💡", "🍦", "⚓️", "🎁", "🦖", "🔒"],
            yours: ["🌙", "🍎", "🕷️", "🎸", "🌵", "🤠", "💎", "🐝"],
            match: "🌙"
        },
        {
            center: ["🎲", "🌋", "👑", "🍿", "🐱", "⚡️", "🔮", "🌲"],
            yours: ["🎲", "🦉", "🍇", "🛎️", "🚗", "💣", "🌸", "👽"],
            match: "🎲"
        },
        {
            center: ["🍉", "🔑", "🎨", "🐙", "🏔️", "🎈", "🤠", "💧"],
            yours: ["🍉", "🦖", "☀️", "🧩", "🍕", "🔒", "🐝", "🚀"],
            match: "🍉"
        },
    ]

    const currentRound = rounds[roundIndex]

    const handleClick = (symbol) => {
        if (symbol === currentRound.match) {
            if (roundIndex < rounds.length - 1) {
                setMessage("Correct")
                setScore(score + 1)
                setRoundIndex(roundIndex + 1)
                setTimer(defaultTimer)
            }
            else { setGameOver(true) }

        }
        else {
            setMessage("Wrong")


        }
    }

    const restartGame = () => {
        setScore(0)
        setMessage("")
        setRoundIndex(0)
        setGameOver(false)
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


    useEffect(() => {
        if (!gameStart) return
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev === 0) {
                    setRoundIndex(roundIndex + 1)
                    setTimer(defaultTimer);
                }
                return prev - 1;

            }


            )
        }, 1000);
        return () => clearInterval(interval);
    }, [gameStart, roundIndex])

    const handleGameStart = () => {
        setGameStart(true)

    }


    return (
        <div className="game-screen">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button className=" block mr-auto px-4 py-2 bg-rounded-600 rounded-lg text-white hover:bg-purple-700 " onClick={() => setScreen("home")}>back</button>
                {!gameStart && <button onClick={handleGameStart} >Start</button>}
                <h2 className="m-0 text-white font-bold">Score: {score}</h2><br />
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
                    <h1>Game Over</h1>
                    <h2>Final Score: {score}</h2>
                    <button onClick={restartGame}>Play Again</button>
                </div>
            )

            }

        </div>
    )
}