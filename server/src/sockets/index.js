import registerBoardSocket from "./board.socket.js";
import { PORT } from "../config/env.js";

const registerSocket = (io) => {
    io.on("connection", (socket) => {

        console.log(`✅ User Connected on ${PORT}`);
        console.log("Socket ID:", socket.id);

        registerBoardSocket(io, socket);

    });
};

export default registerSocket;