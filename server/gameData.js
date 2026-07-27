// A Spot It deck is a finite projective plane. For order 7, it contains:
// 57 symbols/cards (7² + 7 + 1), 8 symbols per card, and exactly one
// matching symbol between every pair of cards.
const ALL_SYMBOLS = Array.from(
    { length: 63 },
    (_, index) => `symbol-${index + 1}`
)

// Dominant color groups for Slice 1.svg through Slice 63.svg. They are used
// only to distribute the character art more evenly across each game card.
const SYMBOL_COLORS = [
    'blue', 'orange', 'blue', 'orange', 'orange', 'green', 'blue', 'blue', 'red', 'red',
    'orange', 'purple', 'blue', 'green', 'orange', 'red', 'orange', 'orange', 'blue', 'orange',
    'red', 'green', 'blue', 'red', 'orange', 'red', 'green', 'purple', 'orange', 'orange',
    'red', 'blue', 'purple', 'orange', 'red', 'orange', 'orange', 'orange', 'green', 'purple',
    'green', 'red', 'orange', 'orange', 'blue', 'blue', 'green', 'orange', 'red', 'orange',
    'orange', 'blue', 'purple', 'purple', 'orange', 'orange', 'orange', 'green', 'blue', 'orange',
    'blue', 'orange', 'orange'
]

const colorBySymbol = Object.fromEntries(
    ALL_SYMBOLS.map((symbol, index) => [symbol, SYMBOL_COLORS[index]])
)

const shuffle = (items) => {
    const shuffled = [...items]

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }

    return shuffled
}

const createCardIndexes = () => {
    const order = 7
    const point = (x, y) => x * order + y
    const direction = (slope) => order * order + slope
    const cards = []

    // Lines y = slope × x + intercept, plus their direction symbol.
    for (let slope = 0; slope < order; slope += 1) {
        for (let intercept = 0; intercept < order; intercept += 1) {
            const card = [direction(slope)]

            for (let x = 0; x < order; x += 1) {
                card.push(point(x, (slope * x + intercept) % order))
            }

            cards.push(card)
        }
    }

    // Vertical lines x = constant, plus their shared direction symbol.
    for (let x = 0; x < order; x += 1) {
        const card = [direction(order)]

        for (let y = 0; y < order; y += 1) {
            card.push(point(x, y))
        }

        cards.push(card)
    }

    // The final card consists of all eight direction symbols.
    cards.push(Array.from({ length: order + 1 }, (_, slope) => direction(slope)))

    return cards
}

const scoreSymbolOrder = (cardIndexes, symbolOrder) => cardIndexes.reduce((score, card) => {
    const colorCounts = card.reduce((counts, symbolIndex) => {
        const color = colorBySymbol[symbolOrder[symbolIndex]]
        counts[color] = (counts[color] || 0) + 1
        return counts
    }, {})

    return score + Object.values(colorCounts).reduce(
        (cardScore, count) => cardScore + Math.max(0, count - 3) ** 2,
        0
    )
}, 0)

const createColorBalancedSymbols = (cardIndexes) => {
    const symbolsForThisGame = shuffle(ALL_SYMBOLS).slice(0, 57)
    let bestOrder = symbolsForThisGame
    let bestScore = Infinity

    // A symbol permutation does not change Spot It's matching rule. It only
    // decides which character art is used for each mathematical symbol.
    for (let attempt = 0; attempt < 1_500; attempt += 1) {
        const candidate = shuffle(symbolsForThisGame)
        const candidateScore = scoreSymbolOrder(cardIndexes, candidate)

        if (candidateScore < bestScore) {
            bestOrder = candidate
            bestScore = candidateScore
        }

        if (bestScore === 0) break
    }

    return bestOrder
}

const createGameDeck = () => {
    const cardIndexes = createCardIndexes()
    const colorBalancedSymbols = createColorBalancedSymbols(cardIndexes)

    return cardIndexes.map(card => card.map(symbolIndex => colorBalancedSymbols[symbolIndex]))
}

const findMatch = (firstCard, secondCard) =>
    firstCard.find(symbol => secondCard.includes(symbol))

const createRounds = (roundCount) => {
    const shuffledDeck = shuffle(createGameDeck())

    return Array.from({ length: roundCount }, (_, roundIndex) => {
        const center = shuffle(shuffledDeck[roundIndex * 2])
        const yours = shuffle(shuffledDeck[roundIndex * 2 + 1])

        return {
            center,
            yours,
            match: findMatch(center, yours)
        }
    })
}

module.exports = { createGameDeck, createRounds }
