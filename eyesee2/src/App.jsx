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
  const [hostId, setHostId] = useState("")
  const [players, setPlayers] = useState([])
  const [lobbySettings, setLobbySettings] = useState({ timer: 0, roundCount: 15, cooldownSeconds: 5 })

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
      setHostId(data.hostId)
      setLobbySettings(data.settings)
      setScreen("lobby")
      setIsHost(true)
    })

    socket.on("playerJoined", (data) => {
      setRoomCode(data.roomCode)
      setPlayers(data.players)
      setHostId(data.hostId)
      setLobbySettings(data.settings)
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
      setHostId(data.hostId)
      setIsHost(data.hostId === socket.id)
      setScreen("lobby")
    })

    socket.on("playerDisconnected", (data) => {
      setPlayers(data.players)
    })

    socket.on("lobbySettingsUpdated", (data) => {
      setLobbySettings(data.settings)
    })

    return () => {
      socket.off("roomCreated")
      socket.off("playerJoined")
      socket.off("gameStarted")
      socket.off("gameRestarted")
      socket.off("hostDisconnected")
      socket.off("playerDisconnected")
      socket.off("lobbySettingsUpdated")
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
          hostId={hostId}
          players={players}
          lobbySettings={lobbySettings}
        />
      )}

      {screen === "game" && (
        <GameScreen
          setScreen={setScreen}
          rounds={rounds}
          roomCode={roomCode}
          isHost={isHost}
          hostId={hostId}
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
