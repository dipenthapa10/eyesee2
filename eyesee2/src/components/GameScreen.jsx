import { useState } from "react"

export const GameScreen = ({ setScreen }) => {

    const [score, setScore] = useState(0)
    const [message, setMessage] = useState("")
    const [roundIndex, setRoundIndex] = useState(0)
    const [gameOver, setGameOver] = useState(false)



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

    return (
        <div>
            <button onClick={() => setScreen("home")}>back</button>
            <h2>Score: {score}</h2><br />
            <p>{message} </p>

            {!gameOver && (<>
                <h2>Center Card</h2>
                <div>
                    {centerCard.map(symbol => (
                        <span
                            key={symbol} onClick={() => handleClick(symbol)}
                        >
                            {symbol}
                        </span>))}
                </div>

                <h2>Your Card</h2>
                <div>
                    {yourCard.map(symbol => (
                        <span key={symbol} onClick={() => handleClick(symbol)}>
                            {symbol}
                        </span>
                    ))}
                </div>
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