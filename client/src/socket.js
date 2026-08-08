import { io } from 'socket.io-client'

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

const socket = io(serverUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    // transports: ['websocket', 'polling'],

})

export default socket