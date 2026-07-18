// A Spot It deck is a finite projective plane. For order 7, it contains:
// 57 symbols/cards (7² + 7 + 1), 8 symbols per card, and exactly one
// matching symbol between every pair of cards.
const EMOJIS = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🐝', '🦋', '🐙', '🦖',
    '🐢', '🐳', '🦉', '🦜', '🌈', '⭐', '🌙', '☀️', '🔥', '🍀',
    '🍎', '🍕', '🍩', '⚽', '🎲', '🎯', '🚗', '🚀', '🎸', '🎁',
    '💎', '👑', '🎈', '🧩', '🔑', '🎨', '🎧', '🛸', '🌵', '🍉',
    '🦀', '🐠', '⚡', '🏀', '🍔', '🎃', '🕶️'
]

const shuffle = (items) => {
    const shuffled = [...items]

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }

    return shuffled
}

const createGameDeck = () => {
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

    return cards.map(card => card.map(symbolIndex => EMOJIS[symbolIndex]))
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
