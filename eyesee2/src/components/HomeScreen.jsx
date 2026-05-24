export const HomeScreen = () => {
    return (
        <>
            <h1> EYE SEE 2</h1>
            <p> find two match and beat your friends</p>

            <button onClick={() => setScreen("create")}>Create Room</button><br></br>
            <button onClick={() => setScreen("join")}>Join Room</button>

        </>
    )
}