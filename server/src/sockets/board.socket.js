import strokeQueue from "../config/queue.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { saveStroke , loadBoard , deleteStroke , undoStroke ,redoStroke} from "../services/board.service.js";
import { isValidRoomId, isValidStrokeId, sanitizeStroke } from "../validators/board.validator.js";

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
    const requireJoinedRoom = () => {
        if (socket.data.roomId) {
            return true;
        }

        socket.emit("room-error", {
            message: "Join a room before using board actions",
        });
        return false;
    };

    // Socket.IO ignores listener return values, so an uncaught rejection here would terminate the process.
    const on = (event, handler, onError) => {
        socket.on(event, async (...args) => {
            try {
                await handler(...args);
            } catch (error) {
                console.error(`Socket event "${event}" failed for ${socket.id}:`, error);
                onError?.(error);
            }
        });
    };

    const rejectPayload = (event) => {
        console.warn(`Rejected invalid "${event}" payload from ${socket.id}`);
    };

    // getting the message from browser using .on and using the roomid to send back msg
    // using io.to.emit to send msg to all in that room
    on("hello", (data) => {
        console.log(data);
        io.to(socket.data.roomId).emit("welcome", {
            message: `joined ${socket.data.roomId}`
        });
    });

    // joins the room with providied roomId
    on("join-room",async (data) => {

        const roomId = data?.roomId;

        if (!isValidRoomId(roomId)) {
            socket.emit("room-error", {
                message: "Invalid room ID",
            });
            return;
        }

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
            roomId
        });

        if (!room) {
            socket.emit("room-error", {
                message: "Room does not exist"
            });

            return;
        }

        await socket.join(roomId);
        // stored the roomid in extra storage of socket so we dont have to get it again and again
        socket.data.roomId = roomId;
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

        await emitRoomUsers(io, roomId);

        const board = await loadBoard(socket.data.roomId);
        // send the board to the frontend
        socket.emit("board-data", board.strokes);

        console.log(`✅ ${socket.id} aka ${socket.data.username} joined ${roomId}`);
    }, () => {
        socket.emit("room-error", {
            message: "Failed to join room",
        });
    });

    // adding the handler for getting strokes
    on("stroke",async (payload) => {
        if (!requireJoinedRoom()) return;

        const stroke = sanitizeStroke(payload);

        if (!stroke) {
            rejectPayload("stroke");
            return;
        }

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
    on("cursor-move", (cursor) => {
            if (!requireJoinedRoom()) return;

            socket.broadcast
                .to(socket.data.roomId)
                .emit("cursor-move", cursor);

    });

    // get the erased stroke and broadcast it to others + change in db
    on("erase", async (strokeId) => {
        if (!requireJoinedRoom()) return;

        if (!isValidStrokeId(strokeId)) {
            rejectPayload("erase");
            return;
        }

        const roomId = socket.data.roomId;
        socket.broadcast.to(roomId).emit("erase", strokeId);
        await deleteStroke(roomId, strokeId);
    });

    // for undo
    on("undo", async () => {
        if (!requireJoinedRoom()) return;

        const roomId = socket.data.roomId;
        socket.broadcast.to(roomId).emit("undo");
        await undoStroke(roomId);
    });

    on("redo", async(payload) => {
        if (!requireJoinedRoom()) return;

        const restoredStroke = sanitizeStroke(payload);

        if (!restoredStroke) {
            rejectPayload("redo");
            return;
        }

        const roomId = socket.data.roomId;
        socket.broadcast.to(roomId).emit("redo");
        await redoStroke(roomId,restoredStroke);
    })

    // for the disconnection
    on("disconnect", async() => {
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