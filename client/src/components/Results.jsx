import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'

export const Results = ({ winner, players, onLobby }) => {
    const podiumPlayers = [players[1], players[0], players[2]].filter(Boolean)

    return (
        <div className="game-over-box">
            <button
                className="results-exit-button"
                onClick={onLobby}
                title="Return to lobby"
                aria-label="Return to lobby"
            >
                <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
            <section className="final-podium" aria-label="Final podium">
                <p className="final-podium-label">Final podium</p>
                <h1>{winner} wins!</h1>
                <div className="podium-places">
                    {podiumPlayers.map((player) => {
                        const rank = players.indexOf(player) + 1

                        return (
                            <div className={`podium-place podium-place-${rank}`} key={player.id}>
                                <span className="podium-letter" aria-hidden="true">
                                    {player.name.charAt(0).toUpperCase()}
                                </span>
                                <strong>{player.name}</strong>
                                <div className="podium-step">
                                    <span>#{rank}</span>
                                    <small>{player.score} pts</small>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {players.length > 3 && (
                <section className="final-scoreboard" aria-label="Remaining final rankings">
                    <p className="final-scoreboard-title">Other ranks</p>
                    {players.slice(3).map((player, index) => (
                        <div className="final-score-row" key={player.id}>
                            <span>#{index + 4}</span>
                            <strong>{player.name}</strong>
                            <span>{player.score}</span>
                        </div>
                    ))}
                </section>
            )}

        </div>
    )
}
