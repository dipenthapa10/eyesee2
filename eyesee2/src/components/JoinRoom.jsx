import { useState, useEffect } from "react"
import socket from "../socket"

export const JoinRoom = ({ setScreen, playerName }) => {
    const [joinedRoom, setJoinedRoom] = useState(false)
    const [players, setPlayers] = useState([])
    const [error, setError] = useState("")

    useEffect(() => {
        socket.on('playerJoined', (data) => {
            console.log("playerJoined received!", data)
            setJoinedRoom(true)
            setPlayers(data.players)
        })
        socket.on('joinError', (data) => {
            console.log("joinError received!", data)
            setError(data.message)
        })
        return () => {
            socket.off('playerJoined')
            socket.off('joinError')
        }
    }, [])

    return (
        <div>
            {error && <p>{error}</p>}

            {!joinedRoom && <h2> joining room ...</h2>}

            {joinedRoom && (
                <div>
                    <h2>waiting for the host to start</h2>
                    <h3>Players in room:</h3>
                    {players.map(player => (
                        <p key={player.id}>{player.name} </p>
                    ))}
                </div>
            )}


            <button onClick={() => setScreen("home")}>Back</button>

        </div>
    )
}
