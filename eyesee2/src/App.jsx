import { useState, useEffect } from "react"
import { HomeScreen } from "./components/HomeScreen"
import { Lobby } from "./components/Lobby"
import { GameScreen } from "./components/GameScreen"
import socket from "./socket"
import "./App.css"

function App() {
  const [screen, setScreen] = useState("home")
  const [playerName, setPlayerName] = useState("")
  const [rounds, setRounds] = useState([])
  const [timer, setTimer] = useState(0)
  const [timerDuration, setTimerDuration] = useState(0)
  const [roomCode, setRoomCode] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState([])

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server! ID:", socket.id)
    })

    return () => {
      socket.off("connect")
    }
  }, [])

  useEffect(() => {
    socket.on("roomCreated", (data) => {
      setRoomCode(data.roomCode)
      setPlayers(data.players)
      setScreen("lobby")
      setIsHost(true)
    })

    socket.on("playerJoined", (data) => {
      setRoomCode(data.roomCode)
      setPlayers(data.players)
      setScreen("lobby")
    })

    socket.on("gameStarted", (data) => {
      console.log("app.jsx received gameStarted!", data)
      console.log("rounds length:", data.rounds.length)

      setRounds(data.rounds)
      setTimer(data.timer)
      setTimerDuration(data.timerDuration)
      setScreen("game")
    })

    socket.on("gameRestarted", (data) => {
      setRounds(data.rounds)
      setTimer(data.timer)
      setTimerDuration(data.timerDuration)
    })

    socket.on("hostDisconnected", (data) => {
      setRoomCode(data.roomCode)
      setPlayers(data.players)
      setIsHost(data.hostId === socket.id)
      setScreen("lobby")
    })

    return () => {
      socket.off("roomCreated")
      socket.off("playerJoined")
      socket.off("gameStarted")
      socket.off("gameRestarted")
      socket.off("hostDisconnected")
    }
  }, [])

  return (
    <div>
      {screen === "home" && (
        <HomeScreen
          setScreen={setScreen}
          setPlayerName={setPlayerName}
          playerName={playerName}
          setRoomCode={setRoomCode}
        />
      )}

      {screen === "lobby" && (
        <Lobby
          setScreen={setScreen}
          playerName={playerName}
          roomCode={roomCode}
          isHost={isHost}
          players={players}
        />
      )}

      {screen === "game" && (
        <GameScreen
          setScreen={setScreen}
          rounds={rounds}
          roomCode={roomCode}
          isHost={isHost}
          playerName={playerName}
          initialPlayers={players}
          initialTimer={timer}
          initialTimerDuration={timerDuration}
        />
      )}
    </div>
  )
}

export default App
