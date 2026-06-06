import { useState, useEffect } from 'react'
import socket from "../socket"

export const CreateRoom = ({ setScreen, playerName }) => {

    const [roomCode, setRoomCode] = useState("")
    const [roomCreated, setRoomCreated] = useState(false)
    const [players, setPlayers] = useState([])

    useEffect(() => {
        socket.on('roomCreated', (data) => {
            setRoomCode(data.roomCode)
            setRoomCreated(true)
        })

        socket.on('playerJoined', (data) => {
            setPlayers(data.players)
        })
        return () => {
            socket.off('roomCreated')
            socket.off('playerJoined')
        }
    }, [])


    return (
        <div>


            {roomCreated && (
                <div>
                    <h3>Room Created!</h3>
                    <h1>{roomCode}</h1>
                    <p> share this with your friend</p>
                    <button onClick={() => setScreen("game")}> Start Game</button>
                </div>
            )

            }
            <br />
            <button onClick={() => setScreen("home")}>Back</button>
        </div>
    )
}

