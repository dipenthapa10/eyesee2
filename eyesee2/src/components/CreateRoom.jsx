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




    const handleStartGame = () => {
        socket.emit('startGame', { roomCode })
    }

    return (
        <div>
            <div>EyeSee2</div>

            {roomCreated && (
                <div>
                    <h3>Room Created!</h3>
                    <h1>{roomCode}</h1>
                    <p> share this with your friend</p>
                    <h3>Players in room:</h3>
                    {players.map(player => (
                        <p key={player.id}>{player.name} </p>
                    ))}
                    <button onClick={handleStartGame}> Start Game</button>
                </div>
            )

            }
            <br />
            <button onClick={() => setScreen("home")}>Back</button>
        </div>
    )
}

