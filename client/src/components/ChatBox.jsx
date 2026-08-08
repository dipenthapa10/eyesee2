import { useState } from "react"

export const ChatBox = ({ activities = [], messages = [], onSend, emptyMessage = 'No messages yet.' }) => {
    const [text, setText] = useState("")
    const feed = [
        ...activities.map((activity) => ({ ...activity, kind: 'activity' })),
        ...messages.map((message) => ({ ...message, kind: 'message' }))
    ].sort((firstEntry, secondEntry) => firstEntry.timestamp - secondEntry.timestamp)

    const handleSubmit = (event) => {
        event.preventDefault()

        const message = text.trim()
        if (!message) return

        onSend(message)
        setText("")
    }

    return (
        <section className="chat-box">
            <div className="chat-message-list" role="log" aria-live="polite">
                {feed.length > 0 ? feed.map((entry) => (
                    entry.kind === 'activity' ? (
                        <p key={`activity-${entry.id}-${entry.timestamp}`} className={`chat-entry activity-${entry.type}`}>
                            <strong>{entry.name}</strong>{' '}
                            {entry.message || (entry.type === 'correct' ? 'found it!' : 'picked the wrong emoji.')}
                        </p>
                    ) : (
                        <p key={`message-${entry.id}`} className="chat-entry chat-message">
                            <strong>{entry.name}:</strong> {entry.text}
                        </p>
                    )
                )) : (
                    <p className="chat-empty">{emptyMessage}</p>
                )}
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
