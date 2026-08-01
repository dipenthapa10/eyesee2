import { io } from 'socket.io-client'

const socket = io('http://localhost:3001', {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    // transports: ['websocket', 'polling'],

})

export default socket