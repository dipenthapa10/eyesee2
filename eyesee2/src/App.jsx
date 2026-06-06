
import { HomeScreen } from "./components/HomeScreen";
import { CreateRoom } from "./components/CreateRoom";
import { JoinRoom } from "./components/JoinRoom"
import { useState } from "react"
import './App.css'
import { GameScreen } from "./components/GameScreen";
import { useEffect } from "react";
import socket from './socket'

function App() {

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server! ID:', socket.id)
    })
  }, [])

  const [screen, setScreen] = useState("home")
  const [playerName, setPlayerName] = useState("")
  return (
    <div >
      {screen === "home" && <HomeScreen setScreen={setScreen} setPlayerName={setPlayerName} playerName={playerName} />}
      {screen === "join" && <JoinRoom setScreen={setScreen} playerName={playerName} />}
      {screen === "create" && <CreateRoom setScreen={setScreen} playerName={playerName} />}
      {screen === "game" && <GameScreen setScreen={setScreen} />}
    </div>
  )
}

export default App
