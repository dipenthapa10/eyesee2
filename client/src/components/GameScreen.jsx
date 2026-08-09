import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faCrown } from '@fortawesome/free-solid-svg-icons'
import socket from "../socket";
import { ChatBox } from './ChatBox'
import { Results } from './Results'

const characterFiles = import.meta.glob(
    '../assets/characters-cropped/Slice *.svg',
    { eager: true, query: '?url', import: 'default' }
)

const characterBySymbol = Object.fromEntries(
    Object.entries(characterFiles).map(([path, imageUrl]) => {
        const sliceNumber = path.match(/Slice (\d+)\.svg$/)?.[1]
        return [`symbol-${sliceNumber}`, imageUrl]
    })
)

const characterImageUrls = Object.values(characterBySymbol)

const cardLayoutCache = new Map()


export const GameScreen = ({ rounds, playerName, isHost, hostId, initialPlayers, initialTimer, initialTimerDuration, activities, chatMessages }) => {
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [timer, setTimer] = useState(initialTimer)
    const [timerDuration, setTimerDuration] = useState(initialTimerDuration)
    const [roundLocked, setRoundLocked] = useState(false)
    const [displayedRoundIndex, setDisplayedRoundIndex] = useState(0)
    const [cardMotion, setCardMotion] = useState('idle')
    const [gameCountdown, setGameCountdown] = useState(3)
    const [symbolsReady, setSymbolsReady] = useState(false)
    const [players, setPlayers] = useState(initialPlayers)
    const [winner, setWinner] = useState("")
    const [now, setNow] = useState(() => Date.now())
    const leaderboardRef = useRef(null)
    const playerPositions = useRef(new Map())
    const displayedRoundRef = useRef(0)
    const pendingRoundRef = useRef(null)
    const cardMotionTimerRef = useRef(null)
    const roundSafetyTimerRef = useRef(null)

    useEffect(() => {
        let cancelled = false

        const preloadSymbols = async () => {
            await Promise.all(characterImageUrls.map((imageUrl) => new Promise((resolve) => {
                const image = new Image()
                const finish = () => resolve()

                image.onload = () => {
                    if (image.decode) {
                        image.decode().catch(() => undefined).finally(finish)
                        return
                    }

                    finish()
                }
                image.onerror = finish
                image.src = imageUrl

                if (image.complete) finish()
            })))

            if (!cancelled) setSymbolsReady(true)
        }

        preloadSymbols()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!symbolsReady) return undefined

        const countdownTimer = setInterval(() => {
            setGameCountdown(currentCount => {
                if (currentCount <= 1) {
                    clearInterval(countdownTimer)
                    return 0
                }

                return currentCount - 1
            })
        }, 1000)

        return () => clearInterval(countdownTimer)
    }, [symbolsReady])





    useEffect(() => {
        const countdownInterval = setInterval(() => setNow(Date.now()), 250)
        const clearCardMotionTimer = () => {
            clearTimeout(cardMotionTimerRef.current)
            cardMotionTimerRef.current = null
        }
        const clearRoundSafetyTimer = () => {
            clearTimeout(roundSafetyTimerRef.current)
            roundSafetyTimerRef.current = null
        }

        const showNewRound = (nextRoundIndex) => {
            if (pendingRoundRef.current === nextRoundIndex) return

            if (displayedRoundRef.current === nextRoundIndex) {
                return
            }

            clearCardMotionTimer()
            clearRoundSafetyTimer()
            pendingRoundRef.current = nextRoundIndex
            setRoundLocked(true)
            setCardMotion('leaving')

            cardMotionTimerRef.current = setTimeout(() => {
                displayedRoundRef.current = nextRoundIndex
                pendingRoundRef.current = null
                setDisplayedRoundIndex(nextRoundIndex)
                setCardMotion('idle')
                cardMotionTimerRef.current = null

                roundSafetyTimerRef.current = setTimeout(() => {
                    setRoundLocked(false)
                    roundSafetyTimerRef.current = null
                }, 300)
            }, 130)
        }


        socket.on('timerTick', (data) => {
            setTimer(data.timer)
        })

        // listen for new round from server
        socket.on('newRound', (data) => {
            showNewRound(data.currentRound)
        })

        socket.on('roundWon', (data) => {
            setPlayers(data.players)
            setRoundLocked(true)
        })

        // listen for game over from server
        socket.on('gameOver', (data) => {
            setGameOver(true)
            setWinner(data.winner || "")
            setPlayers(data.players || [])

        })

        socket.on('gameRestarted', (data) => {
            clearCardMotionTimer()
            clearRoundSafetyTimer()
            pendingRoundRef.current = null
            displayedRoundRef.current = 0
            setDisplayedRoundIndex(0)
            setCardMotion('idle')
            setScore(0)
            setGameOver(false)
            setTimer(data.timer)
            setTimerDuration(data.timerDuration)
            setWinner("")
            setPlayers([])
            setRoundLocked(false)
        })

        socket.on('scoreUpdated', (data) => {

            setPlayers(data.players)
        })
        socket.on('playerDisconnected', (data) => {
            setPlayers(data.players)
        })
        socket.on('cooldownUpdated', (data) => {
            setPlayers(data.players)
        })
        socket.on('matchDone', (data) => {
            showNewRound(data.currentRound)
        })
        return () => {
            socket.off('timerTick')
            socket.off('newRound')
            socket.off('roundWon')
            socket.off('gameOver')
            socket.off('gameRestarted')
            socket.off('scoreUpdated')
            socket.off('playerDisconnected')
            socket.off('cooldownUpdated')
            socket.off('matchDone')
            clearInterval(countdownInterval)
            clearCardMotionTimer()
            clearRoundSafetyTimer()

        }


    }, [])

    const currentRound = rounds[displayedRoundIndex]
    const startOverlayVisible = gameCountdown > 0 || !symbolsReady
    const sortedPlayers = [...players].sort((firstPlayer, secondPlayer) => {
        const connectionOrder = Number(firstPlayer.connected === false) - Number(secondPlayer.connected === false)
        if (connectionOrder !== 0) return connectionOrder

        return secondPlayer.score - firstPlayer.score
    })
    const leaderboardState = sortedPlayers.map(player => `${player.id}:${player.score}:${player.connected}`).join('|')

    useLayoutEffect(() => {
        const leaderboard = leaderboardRef.current
        if (!leaderboard) return

        const nextPositions = new Map()
        leaderboard.querySelectorAll('[data-player-id]').forEach((row) => {
            const playerId = row.dataset.playerId
            const nextTop = row.getBoundingClientRect().top
            const previousTop = playerPositions.current.get(playerId)

            if (previousTop !== undefined && previousTop !== nextTop && row.animate) {
                row.animate(
                    [
                        { transform: `translateY(${previousTop - nextTop}px)` },
                        { transform: 'translateY(0)' }
                    ],
                    { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
                )
            }

            nextPositions.set(playerId, nextTop)
        })

        playerPositions.current = nextPositions
    }, [leaderboardState])

    if (!currentRound) return <div> Loading Time...</div>

    const localPlayer = players.find(player => player.id === socket.id)
    const cooldownRemaining = Math.max(0, Math.ceil(((localPlayer?.cooldownUntil || 0) - now) / 1000))

    const handleClick = (symbol) => {
        if (gameOver || startOverlayVisible || roundLocked || cooldownRemaining > 0) return

        if (symbol === currentRound.match) {
            setScore(score + 1)
            setRoundLocked(true)
            socket.emit('cardMatch', { playerName, symbol, roundIndex: displayedRoundIndex })
        } else {
            socket.emit('wrongAnswer', { symbol, roundIndex: displayedRoundIndex })
        }
    }

    const lobby = () => socket.emit('returnToLobby')
    const handleChatSend = (text) => socket.emit('sendChatMessage', { text })


    const centerCard = currentRound.center;
    const yourCard = currentRound.yours;

    const createCardLayout = (cardId) => {
        const cachedLayout = cardLayoutCache.get(cardId)
        if (cachedLayout) return cachedLayout

        let seed = 0

        for (const character of cardId) {
            seed = (seed * 31 + character.codePointAt(0)) >>> 0
        }

        const random = () => {
            seed += 0x6D2B79F5
            let value = seed
            value = Math.imul(value ^ (value >>> 15), value | 1)
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296
        }
        // Every card deliberately has two visually large symbols, four
        // medium symbols, and only two small symbols. We shuffle the list so
        // the same picture never always gets the same size.
        const largeSymbolSizes = [30, 27]
        const mediumSymbolSizes = [24, 22, 20, 18]
        const smallSymbolSizes = [16, 14]
        const symbolSizes = [...largeSymbolSizes, ...mediumSymbolSizes, ...smallSymbolSizes]

        for (let index = symbolSizes.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(random() * (index + 1))
            ;[symbolSizes[index], symbolSizes[swapIndex]] = [symbolSizes[swapIndex], symbolSizes[index]]
        }

        const order = symbolSizes
            .map((size, index) => ({ size, index }))
            .sort((first, second) => second.size - first.size)
        const safetyGap = 2.6
        // These are scoring probes, not symbol slots. They let us reject a
        // card that leaves a giant empty pocket anywhere inside the circle.
        const coveragePoints = []
        for (let x = 14; x <= 86; x += 18) {
            for (let y = 14; y <= 86; y += 18) {
                if (Math.hypot(x - 50, y - 50) <= 36) coveragePoints.push({ x, y })
            }
        }

        const buildScatteredLayout = (collisionScale, restartCount) => {
            let bestLayout = null
            let bestLayoutScore = -Infinity

            for (let restart = 0; restart < restartCount; restart += 1) {
                const layout = Array(8)
                let complete = true

                for (const { size, index } of order) {
                    const collisionRadius = size * collisionScale
                    const maxRadius = 50 - collisionRadius - 1.5
                    const validCandidates = []

                    for (let attempt = 0; attempt < 460; attempt += 1) {
                        const angle = random() * Math.PI * 2
                        // sqrt produces points across the whole disc rather
                        // than choosing a centre or an outer-ring position.
                        const radius = maxRadius * Math.sqrt(random())
                        const candidate = {
                            x: 50 + Math.cos(angle) * radius,
                            y: 50 + Math.sin(angle) * radius,
                            size,
                            collisionRadius,
                            rotation: Math.round(random() * 360)
                        }
                        let smallestClearance = Infinity

                        for (const placedSymbol of layout) {
                            if (!placedSymbol) continue

                            const distance = Math.hypot(candidate.x - placedSymbol.x, candidate.y - placedSymbol.y)
                            const requiredDistance = candidate.collisionRadius + placedSymbol.collisionRadius + safetyGap
                            smallestClearance = Math.min(smallestClearance, distance - requiredDistance)
                        }

                        if (smallestClearance >= 0) {
                            validCandidates.push({ ...candidate, clearance: smallestClearance })
                        }
                    }

                    if (validCandidates.length === 0) {
                        complete = false
                        break
                    }

                    // Pick from every safe spot: this is the key difference
                    // from the old outer-ring layout.
                    layout[index] = validCandidates[Math.floor(random() * validCandidates.length)]
                }

                if (!complete) continue

                const smallestClearance = layout.reduce((smallest, symbol, index) => {
                    for (let compareIndex = index + 1; compareIndex < layout.length; compareIndex += 1) {
                        const comparison = layout[compareIndex]
                        const distance = Math.hypot(symbol.x - comparison.x, symbol.y - comparison.y)
                        const clearance = distance - symbol.collisionRadius - comparison.collisionRadius - safetyGap
                        smallest = Math.min(smallest, clearance)
                    }

                    return smallest
                }, Infinity)
                const largestEmptyPocket = coveragePoints.reduce((largestPocket, point) => {
                    const nearestSymbol = layout.reduce((nearest, symbol) => {
                        const distanceToArtwork = Math.max(
                            0,
                            Math.hypot(point.x - symbol.x, point.y - symbol.y) - symbol.collisionRadius
                        )
                        return Math.min(nearest, distanceToArtwork)
                    }, Infinity)

                    return Math.max(largestPocket, nearestSymbol)
                }, 0)
                const layoutScore = (
                    smallestClearance * 0.15
                    - largestEmptyPocket * 7
                    + random() * 0.1
                )

                if (layoutScore > bestLayoutScore) {
                    bestLayout = layout
                    bestLayoutScore = layoutScore
                }
            }

            return bestLayout
        }

        // Both attempts are random scatter searches. The second one only
        // slightly relaxes the invisible collision circle if an unusually
        // wide set of SVGs cannot fit on the first pass.
        const layout = buildScatteredLayout(0.56, 650) || buildScatteredLayout(0.52, 900)

        cardLayoutCache.set(cardId, layout)
        return layout
    }

    const getSymbolStyle = (index, cardId) => {
        const placement = createCardLayout(cardId)[index]

        return {
            left: `${placement.x}%`,
            top: `${placement.y}%`,
            width: `${placement.size}%`,
            height: `${placement.size}%`,
            transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`
        }
    }

    const playerList = (
        <section ref={leaderboardRef} className="game-player-list" aria-label="Players">
            {sortedPlayers.length > 0 ? (
                sortedPlayers.map((p, i) => (
                    <div key={p.id} data-player-id={p.id} className="leaderboard-row">
                        <span className="player-rank">#{i + 1}</span>
                        <div className={`lobby-player-box ${p.connected === false ? 'player-inactive' : ''} ${p.cooldownUntil > now ? 'player-cooldown' : ''} ${p.correctUntil > now ? 'player-correct' : ''}`}>
                            <div className={`lobby-player-avatar ${i === 1 ? 'p2' : ''}`}>
                                {p.name[0].toUpperCase()}
                                {p.id === hostId && (
                                    <span className="lobby-host-badge" title="Host">
                                        <FontAwesomeIcon icon={faCrown} aria-label="Host" />
                                    </span>
                                )}
                            </div>
                            <div className="lobby-player-info">
                                <div className="game-player-name-row">
                                    <p className="lobby-player-name">
                                        {p.name}{p.id === socket.id && <span className="player-you-label"> (You)</span>}
                                    </p>
                                </div>
                                {p.connected === false && <span className="player-status-tag">Left</span>}
                            </div>
                            <span className="lobby-player-badge">{p.score}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="leaderboard-row">
                    <span className="player-rank">#1</span>
                    <div className="lobby-player-box">
                        <div className="lobby-player-avatar">
                            {playerName ? playerName[0].toUpperCase() : 'P'}
                            {isHost && (
                                <span className="lobby-host-badge" title="Host">
                                    <FontAwesomeIcon icon={faCrown} aria-label="Host" />
                                </span>
                            )}
                        </div>
                        <div className="lobby-player-info">
                            <div className="game-player-name-row">
                                <p className="lobby-player-name">{playerName}<span className="player-you-label"> (You)</span></p>
                            </div>
                        </div>
                        <span className="lobby-player-badge">{score}</span>
                    </div>
                </div>
            )}
        </section>
    )






    return (
        <div className="game-page">
            <header className="game-hud app-hud">
                <p className="lobby-logo">EyeSee2</p>
                <span>Round: {displayedRoundIndex + 1} / {rounds.length}</span>
                <span>
                    <FontAwesomeIcon className="timer-icon" icon={faClock} />
                    {timerDuration === 0 ? 'No Limit' : timer}
                </span>
            </header>
            <aside className="game-player-sidebar">
                {playerList}
            </aside>
            <main className="game-main">
                {symbolsReady && gameCountdown > 0 && !gameOver && (
                    <div className="round-countdown" aria-live="assertive">
                        <span>{gameCountdown}</span>
                    </div>
                )}
                {!gameOver && (
                    <div className={`game-cards-area ${startOverlayVisible ? 'cards-countdown' : ''}`}>
                        <div className={`card ${cardMotion === 'leaving' ? 'card-leave' : 'card-enter'}`} key={`center-${displayedRoundIndex}`}>
                            {centerCard.map((symbol, index) => (
                                <span
                                    className="symbol"
                                    key={symbol}
                                    style={getSymbolStyle(index, centerCard.join(''))}
                                    onClick={() => handleClick(symbol)}
                                >
                                    <img
                                        className="symbol-image"
                                        src={characterBySymbol[symbol]}
                                        alt=""
                                        draggable="false"
                                    />
                                </span>
                            ))}
                        </div>

                        <div className={`card your-card ${cardMotion === 'leaving' ? 'card-leave' : 'card-enter'}`} key={`yours-${displayedRoundIndex}`}>
                            {yourCard.map((symbol, index) => (
                                <span
                                    className="symbol"
                                    key={symbol}
                                    style={getSymbolStyle(index, yourCard.join(''))}
                                    onClick={() => handleClick(symbol)}
                                >
                                    <img
                                        className="symbol-image"
                                        src={characterBySymbol[symbol]}
                                        alt=""
                                        draggable="false"
                                    />
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {gameOver && (
                    <Results
                        winner={winner}
                        players={sortedPlayers}
                        onLobby={lobby}
                    />
                )}
            </main>

            <aside className="game-sidebar" aria-label="Game activity">
                <ChatBox
                    activities={activities}
                    messages={chatMessages}
                    onSend={handleChatSend}
                    emptyMessage="Eye Seeeeeee twooooooooooo!"
                />
            </aside>
        </div>
    )
}
