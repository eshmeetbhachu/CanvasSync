import registerBoardSocket from "./board.socket.js";

const registerSocket = (io) => {
    io.on("connection", (socket) => {

        console.log("✅ User Connected");
        console.log("Socket ID:", socket.id);

        registerBoardSocket(io, socket);

    });
};

export default registerSocket;