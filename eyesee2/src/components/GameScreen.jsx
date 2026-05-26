import { useState } from "react"

export const GameScreen = ({ setScreen }) => {
    // const allSymbols = [
    //     "🍎", "🍌", "🍇", "🎯", "🎲", "🧩", "🚗", "🚀", "🛸", "⏰",
    //     "💡", "🔑", "🔒", "👻", "👽", "🤖", "🤠", "👑", "🍕", "🍦",
    //     "🎸", "🎨", "⚽️", "🏀", "🌋", "🏔️", "☀️", "🌙", "☁️", "⚡️",
    //     "❄️", "🔥", "💧", "🌲", "🍀", "🌸", "🐱", "🐶", "🦖", "🐙",
    //     "🕷️", "🐝", "🦉", "⚓️", "💣", "🎈", "🎁", "💎", "🔮", "🛎️",
    //     "🍿", "🍩", "🍉", "🌵", "🕶️", "🎩", "🛹"
    // ];

    const [score, setScore] = useState(0)

    const [message, setMessage] = useState("")
    const centerCard = ["🍎", "🍌", "🎯", "🎲", "🧩", "🚗", "🚀", "🛸"]
    const yourCard = ["🍇", "🍌", "👻", "👑", "🍕", "🎸", "⚽️", "🌙"]

    const handleClick = (symbol) => {
        if (symbol === "🍌") {
            setMessage("Correct")
            setScore(score + 1)
        }
        else {
            setMessage("Wrong")
        }
    }

    return (
        <div>
            <button onClick={() => setScreen("home")}>back</button>
            <h2>Score: {score}</h2><br />
            <p>{message}</p>

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

        </div>
    )
}