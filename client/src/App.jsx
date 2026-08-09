import { useState, useEffect } from "react"
import { HomeScreen } from "./components/HomeScreen"
import { Lobby } from "./components/Lobby"
import { GameScreen } from "./components/GameScreen"
import socket from "./socket"
import "./App.css"

const clearRoomUrl = () => {
  const url = new URL(window.location.href)
  if (!url.searchParams.has("room")) return

  url.searchParams.delete("room")
  window.history.replaceState({}, "", url)
}

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
  const [lobbySettings, setLobbySettings] = useState({ timer: 0, roundCount: 23, cooldownSeconds: 5, maxPlayers: 3 })
  const [activities, setActivities] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [joinError, setJoinError] = useState("")

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
      clearRoomUrl()
      setRoomCode(data.roomCode)
      setPlayers(data.players)
      setHostId(data.hostId)
      setIsHost(data.hostId === socket.id)
      setLobbySettings(data.settings)
      setActivities([])
      setChatMessages([])
      setScreen("lobby")
      setIsHost(true)
    })

    socket.on("playerJoined", (data) => {
      clearRoomUrl()
      setRoomCode(data.roomCode)
      setPlayers(data.players)
      setHostId(data.hostId)
      setLobbySettings(data.settings)
      setScreen("lobby")
    })

    socket.on("gameStarted", (data) => {
      setRounds(data.rounds)
      setTimer(data.timer)
      setTimerDuration(data.timerDuration)
      setActivities([])
      setScreen("game")
    })

    socket.on("gameOver", () => {
      setChatMessages([])
    })

    socket.on("gameRestarted", (data) => {
      setRounds(data.rounds)
      setTimer(data.timer)
      setTimerDuration(data.timerDuration)
    })

    socket.on("returnedToLobby", (data) => {
      setRoomCode(data.roomCode)
      setPlayers(data.players)
      setHostId(data.hostId)
      setIsHost(data.hostId === socket.id)
      setLobbySettings(data.settings)
      setActivities([])
      setChatMessages([])
      setScreen("lobby")
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

    socket.on("roomStateUpdated", (data) => {
      setRoomCode(data.roomCode)
      setPlayers(data.players)
      setHostId(data.hostId)
      setIsHost(data.hostId === socket.id)
      setLobbySettings(data.settings)
    })

    socket.on("lobbySettingsUpdated", (data) => {
      setLobbySettings(data.settings)
    })

    socket.on("joinError", (data) => {
      setJoinError(data.message)
    })

    socket.on("activityUpdate", (activity) => {
      setActivities(currentActivities => [...currentActivities, activity].slice(-8))
    })

    socket.on("chatMessage", (message) => {
      setChatMessages(currentMessages => [...currentMessages, message].slice(-50))
    })

    return () => {
      socket.off("roomCreated")
      socket.off("playerJoined")
      socket.off("gameStarted")
      socket.off("gameOver")
      socket.off("gameRestarted")
      socket.off("returnedToLobby")
      socket.off("hostDisconnected")
      socket.off("playerDisconnected")
      socket.off("roomStateUpdated")
      socket.off("lobbySettingsUpdated")
      socket.off("joinError")
      socket.off("activityUpdate")
      socket.off("chatMessage")
    }
  }, [])

  return (
    <div>
      {screen === "home" && (
        <HomeScreen
          setPlayerName={setPlayerName}
          playerName={playerName}
          setRoomCode={setRoomCode}
          joinError={joinError}
          clearJoinError={() => setJoinError("")}
        />
      )}

      {screen === "lobby" && (
        <Lobby
          playerName={playerName}
          roomCode={roomCode}
          isHost={isHost}
          hostId={hostId}
          players={players}
          lobbySettings={lobbySettings}
          activities={activities}
          chatMessages={chatMessages}
        />
      )}

      {screen === "game" && (
        <GameScreen
          setScreen={setScreen}
          rounds={rounds}
          isHost={isHost}
          hostId={hostId}
          playerName={playerName}
          initialPlayers={players}
          initialTimer={timer}
          initialTimerDuration={timerDuration}
          activities={activities}
          chatMessages={chatMessages}
        />
      )}
    </div>
  )
}

export default App
