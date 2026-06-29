
import { HomeScreen } from "./components/HomeScreen";
import { CreateRoom } from "./components/CreateRoom";
import { JoinRoom } from "./components/JoinRoom"
import { useState } from "react"
import { Lobby } from "./components/Lobby"
import './App.css'
import { GameScreen } from "./components/GameScreen";
import { useEffect } from "react";
import socket from './socket'

function App() {
  const [screen, setScreen] = useState("home")
  const [playerName, setPlayerName] = useState("")
  const [rounds, setRounds] = useState([])
  const [roomCode, setRoomCode] = useState("")
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server! ID:', socket.id)
    })


    return () => {
      socket.off('connect')
    }
  }, [])

  useEffect(() => {

    socket.on('roomCreated', (data) => {
      setRoomCode(data.roomCode)
      setScreen("lobby")
      setIsHost(true)
    })

    socket.on('playerJoined', (data) => {
      setRoomCode(data.roomCode)

      setScreen("lobby")

    })

    socket.on('gameStarted', (data) => {
      console.log("app.jsx received gameStarted!", data)
      console.log("rounds length:", data.rounds.length)
      setRounds(data.rounds)
      setScreen("game")
    })
    return () => {
      socket.off('roomCreated')
      socket.off('playerJoined')
      socket.off('gameStarted')
    }
  }, [])


  return (
    <div >
      {screen === "home" && <HomeScreen setScreen={setScreen} setPlayerName={setPlayerName} playerName={playerName} setRoomCode={setRoomCode} />}
      {screen === "lobby" && (<Lobby setScreen={setScreen} playerName={playerName} roomCode={roomCode} isHost={isHost} />)}
      {screen === "game" && <GameScreen setScreen={setScreen} rounds={rounds} roomCode={roomCode} playerName={playerName} />}
    </div>
  )
}

export default App
