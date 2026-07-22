export const ActivityLog = ({ activities, emptyMessage = 'Waiting for players...', persistentMessage }) => (
    <section className="game-activity-panel" aria-label="Activity log">
        <div className="game-activity-list" role="log" aria-live="polite">
            {activities.length > 0 && (
                activities.map((activity) => (
                    <p
                        className={`game-activity-entry activity-${activity.type}`}
                        key={`${activity.id}-${activity.timestamp}`}
                    >
                        <strong>{activity.name}</strong>{' '}
                        {activity.message || (activity.type === 'correct' ? 'found it!' : 'picked the wrong emoji.')}
                    </p>
                ))
            )}
            {persistentMessage ? (
                <p className="game-activity-empty">{persistentMessage}</p>
            ) : activities.length === 0 ? (
                <p className="game-activity-empty">{emptyMessage}</p>
            ) : null}
        </div>
    </section>
)
