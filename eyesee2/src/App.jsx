
import { HomeScreen } from "./components/HomeScreen";
import { CreateRoom } from "./components/CreateRoom";
import { JoinRoom } from "./components/JoinRoom"
import { useState } from "react"
import './App.css'
import { GameScreen } from "./components/GameScreen";
import { useEffect } from "react";
import socket from './socket'

function App() {
  const [screen, setScreen] = useState("home")
  const [playerName, setPlayerName] = useState("")
  const [rounds, setRounds] = useState([])
  const [roomCode, setRoomCode] = useState("")

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
    })

    socket.on('playerJoined', (data) => {
      setRoomCode(data.roomCode)
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
      {screen === "join" && <JoinRoom setScreen={setScreen} playerName={playerName} />}
      {screen === "create" && <CreateRoom setScreen={setScreen} playerName={playerName} />}
      {screen === "game" && <GameScreen setScreen={setScreen} rounds={rounds} roomCode={roomCode} playerName={playerName} />}
    </div>
  )
}

export default App
