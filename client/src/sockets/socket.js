import { io } from "socket.io-client";

const createSocket = (accessToken) => {
    const socket = io(import.meta.env.VITE_API_URL, {
        auth: {
            token: accessToken,
        },
    });

    return socket;
};

export default createSocket;


//  METHOD 2 NORMAL METHOD
// // means connect me to a socket server that is running on localhost 3000
// const socket = io(import.meta.env.VITE_SOCKET_URL);

// // this socket is differet from the server side socket
// export default socket;