import { saveStroke , loadBoard } from "../services/board.service.js";

// the structure is . rooms is an object, and inside we make objects named the roomId, and inside we store the socketid as key and usernname as values.
const rooms = {};   


const registerBoardSocket = (io, socket) => {

    // getting the message from browser using .on and using the roomid to send back msg
    // using io.to.emit to send msg to all in that room
    socket.on("hello", (data) => {
        console.log(data);
        io.to(socket.data.roomId).emit("welcome", {
            message: `joined ${socket.data.roomId}`
        });
    });

    // joins the room with providied roomId
    socket.on("join-room",async (data) => {
        socket.join(data.roomId);
        // stored the roomid in extra storage of socket so we dont have to get it again and again
        socket.data.roomId = data.roomId;
        socket.data.username = data.username;

        if (!rooms[data.roomId]) {
            rooms[data.roomId] = {};
        }

        rooms[data.roomId][socket.id] = {
            username: data.username,
        };

        io.to(data.roomId).emit(
            "room-users",
            Object.values(rooms[data.roomId])
        );

        const board = await loadBoard(socket.data.roomId);
        // send the board to the frontend
        socket.emit("board-data", board.strokes);

        console.log(`✅ ${socket.id} aka ${data.username} joined ${data.roomId}`);
    });

    // adding the handler for getting strokes
    socket.on("stroke",async (stroke) => {
        socket.broadcast.to(socket.data.roomId).emit("stroke",stroke);

        // from boared.service.js we get function to store in db
        try {
            await saveStroke(socket.data.roomId, stroke);
        } catch (error) {
            console.error("Failed to save stroke:", error);
        }
    })

    // socket for recevieng and send the cursor details
    socket.on("cursor-move", (cursor) => {

            socket.broadcast
                .to(socket.data.roomId)
                .emit("cursor-move", cursor);

    });

    // for the disconnection
    socket.on("disconnect", () => {
        const roomId = socket.data.roomId;
        const username = socket.data.username;

        console.log("Disconnect");
        console.log("roomId:", roomId);
        console.log("socket.id:", socket.id);
        console.log("rooms:", rooms);

        // straight up just delete the socket id
        delete rooms[roomId][socket.id];

        // broadcast the removed id so we can remove its cursor details
        socket.broadcast.to(roomId).emit("cursor-remove", {
            id: socket.id,
        });

        // we check if the room has any socketid left. if not we just delete the room,
        // and we otherwise send the io.emit message of the remaining values.
        if (Object.keys(rooms[roomId]).length === 0) {
            delete rooms[roomId];
        } else {
            io.to(roomId).emit(
                "room-users",
                Object.values(rooms[roomId])
            );
        }
    });
};

export default registerBoardSocket;