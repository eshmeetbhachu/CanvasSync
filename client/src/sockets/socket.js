import {io} from "socket.io-client"

// means connect me to a socket server that is running on localhost 3000
const socket = io("http://localhost:3000");

// this socket is differet from the server side socket
export default socket;