import {io} from "socket.io-client"

//  METHOD 1 FOR TESTING MULTIPLE SERVER
const params = new URLSearchParams(window.location.search);

const backendPort = params.get("backend") || "3000";

const socket = io(`http://localhost:${backendPort}`);

export default socket;



//  METHOD 2 NORMAL METHOD
// // means connect me to a socket server that is running on localhost 3000
// const socket = io(import.meta.env.VITE_SOCKET_URL);

// // this socket is differet from the server side socket
// export default socket;