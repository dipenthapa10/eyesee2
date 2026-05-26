
import { HomeScreen } from "./components/HomeScreen";
import { CreateRoom } from "./components/CreateRoom";
import { JoinRoom } from "./components/JoinRoom";
import { useState } from "react"
import './App.css'
import { GameScreen } from "./components/GameScreen";

function App() {

  const [screen, setScreen] = useState("home")
  return (
    <div >
      {screen === "home" && <HomeScreen setScreen={setScreen} />}
      {screen === "join" && <GameScreen setScreen={setScreen} />}
      {screen === "create" && <CreateRoom setScreen={setScreen} />}
    </div>
  )
}

export default App
