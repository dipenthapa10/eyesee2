// Keeping the creature list in one place means the home screen, lobby, and
// game always agree on which image belongs to each player.
const creatureFiles = import.meta.glob(
    './assets/creatures/*.{svg,png,jpg,jpeg,webp}',
    { eager: true, query: '?url', import: 'default' }
)

export const creatures = Object.entries(creatureFiles)
    .sort(([firstPath], [secondPath]) => firstPath.localeCompare(secondPath, undefined, { numeric: true }))
    .map(([path, imageUrl], index) => ({
        id: path.split('/').pop().replace(/\.[^.]+$/, ''),
        imageUrl,
        label: `Creature ${index + 1}`
    }))

export const creatureById = Object.fromEntries(
    creatures.map(({ id, imageUrl }) => [id, imageUrl])
)
