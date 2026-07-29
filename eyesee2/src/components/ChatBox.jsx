import { useState } from "react"

export const ChatBox = ({ messages = [], onSend }) => {
    const [text, setText] = useState("")

    const handleSubmit = (event) => {
        event.preventDefault()

        const message = text.trim()
        if (!message) return

        onSend(message)
        setText("")
    }

    return (
        <section className="chat-box">
            <div className="chat-message-list">
                {messages.map((message) => (
                    <p key={message.id} className="chat-message">
                        <strong>{message.name}:</strong> {message.text}
                    </p>
                ))}
            </div>

            <form className="chat-form" onSubmit={handleSubmit}>
                <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Type a message..."
                    maxLength={140}
                />
            </form>
        </section>
    )
}