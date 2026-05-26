

export const HomeScreen = ({ setScreen }) => {



    return (
        <div className="hero-page">
            <h1 className="hero-title" > EYE SEE 2</h1>
            <p className="subtitle"> find two match and beat your friends</p>

            <input type="text" placeholder="Enter Room Code" />

            <button onClick={() => setScreen("join")}> Join Room</button>
            <button onClick={() => setScreen("create")}> Create Room</button>
        </div>


    )
}