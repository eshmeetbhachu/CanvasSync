import strokeQueue from "../config/queue.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { saveStroke , loadBoard , deleteStroke , undoStroke ,redoStroke} from "../services/board.service.js";

// the structure is . rooms is an object, and inside we make objects named the roomId, and inside we store the socketid as key and usernname as values.
// const rooms = {};   was hardcoded, replaced by the emitroomusers function

// helper function to get all the sockets in the room so it is syncronized across servers. unline the hardcoded one we did
// it does get all the sockets in this roomid and then we create an array that has all the sockets usernames
const emitRoomUsers = async (io, roomId) => {

    const sockets = await io.in(roomId).fetchSockets();

    const uniqueUsers = new Map();

    for (const socket of sockets) {
        uniqueUsers.set(socket.data.userId, {
            userId: socket.data.userId,
            username: socket.data.username,
        });
    }

    const users = Array.from(uniqueUsers.values());

    io.to(roomId).emit("room-users", users);

};


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

        const user = await User.findById(socket.data.userId);

        if (!user) {
            socket.emit("room-error", {
                message: "Authenticated user was not found",
            });
            return;
        }

        console.log("Authenticated user:", {
            id: user._id,
            username: user.username,
        });

        const room = await Room.findOne({
            roomId: data.roomId
        });

        if (!room) {
            socket.emit("room-error", {
                message: "Room does not exist"
            });

            return;
        }

        await socket.join(data.roomId);
        // stored the roomid in extra storage of socket so we dont have to get it again and again
        socket.data.roomId = data.roomId;
        socket.data.username = user.username;
        console.log("Socket data:", socket.data);

        // the below was the hardcoded method to get the usernames of the sockets.

        // if (!rooms[data.roomId]) {
        //     rooms[data.roomId] = {};
        // }

        // rooms[data.roomId][socket.id] = {
        //     username: data.username,
        // };

        // io.to(data.roomId).emit(
        //     "room-users",
        //     Object.values(rooms[data.roomId])
        // );

        await emitRoomUsers(io, data.roomId);

        const board = await loadBoard(socket.data.roomId);
        // send the board to the frontend
        socket.emit("board-data", board.strokes);

        console.log(`✅ ${socket.id} aka ${socket.data.username} joined ${data.roomId}`);
    });

    // adding the handler for getting strokes
    socket.on("stroke",async (stroke) => {
        const roomId = socket.data.roomId;

        // Real-time path: immediately send stroke to other users
        socket.broadcast.to(roomId).emit("stroke",stroke);

        // Persistence path: put the work into the queue
        try {
            const job = await strokeQueue.add("save-stroke", {
            roomId,
            stroke,
        });

        console.log("Job added:", job.id);
        } catch (error) {
            console.error("Failed to save stroke to queue:", error);
        }
    })

    // socket for recevieng and send the cursor details
    socket.on("cursor-move", (cursor) => {

            socket.broadcast
                .to(socket.data.roomId)
                .emit("cursor-move", cursor);

    });

    // get the erased stroke and broadcast it to others + change in db
    socket.on("erase", async (strokeId) => {
        const roomId = socket.data.roomId;
        socket.broadcast.to(roomId).emit("erase", strokeId);
        await deleteStroke(roomId, strokeId);
    });

    // for undo
    socket.on("undo", async () => {
        const roomId = socket.data.roomId;
        socket.broadcast.to(roomId).emit("undo");
        await undoStroke(roomId);
    });

    socket.on("redo", async(restoredStroke) => {
        const roomId = socket.data.roomId;
        socket.broadcast.to(roomId).emit("redo");
        await redoStroke(roomId,restoredStroke);
    })

    // for the disconnection
    socket.on("disconnect", async() => {
        const roomId = socket.data.roomId;
        const username = socket.data.username;

        console.log("Disconnect");
        console.log("roomId:", roomId);
        console.log("socket.id:", socket.id);


        // 1. this also was using the hardcoded method

        // straight up just delete the socket id
        // delete rooms[roomId][socket.id];

        // broadcast the removed id so we can remove its cursor details
        socket.broadcast.to(roomId).emit("cursor-remove", {
            id: socket.id,
        });

        // we check if the room has any socketid left. if not we just delete the room,
        // and we otherwise send the io.emit message of the remaining values.
        // if (Object.keys(rooms[roomId]).length === 0) {
        //     delete rooms[roomId];
        // } else {
        //     io.to(roomId).emit(
        //         "room-users",
        //         Object.values(rooms[roomId])
        //     );
        // }

        await emitRoomUsers(io, roomId);
    });
};

export default registerBoardSocket;