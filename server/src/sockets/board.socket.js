import Room from "../models/Room.js";
import User from "../models/User.js";
import { addStroke, loadBoard, setStrokeDeleted } from "../services/board.service.js";
import { isValidRev, isValidRoomId, isValidStrokeId, sanitizeCursor, sanitizeStroke } from "../validators/board.validator.js";

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
    const NOT_JOINED = { ok: false, message: "Join a room before using board actions" };

    // Socket.IO ignores listener return values, so an uncaught rejection here would terminate the process.
    // Handlers return their acknowledgement; a thrown error is acknowledged as a failure.
    const on = (event, handler, errorMessage = "Server error") => {
        socket.on(event, async (...args) => {
            const ack = typeof args.at(-1) === "function" ? args.pop() : null;

            try {
                const result = await handler(...args);
                ack?.(result);
            } catch (error) {
                console.error(`Socket event "${event}" failed for ${socket.id}:`, error);
                ack?.({ ok: false, message: errorMessage });
            }
        });
    };

    const rejectPayload = (event, message) => {
        console.warn(`Rejected invalid "${event}" payload from ${socket.id}`);
        return { ok: false, message };
    };

    // joins the room with providied roomId
    on("join-room", async (data) => {
        const roomId = data?.roomId;

        if (!isValidRoomId(roomId)) {
            return { ok: false, message: "Invalid room ID" };
        }

        const user = await User.findById(socket.data.userId);

        if (!user) {
            return { ok: false, message: "Authenticated user was not found" };
        }

        const room = await Room.exists({ roomId });

        if (!room) {
            return { ok: false, message: "Room does not exist" };
        }

        // Join before reading the board: any change committed after the read is then broadcast to this socket.
        await socket.join(roomId);
        // stored the roomid in extra storage of socket so we dont have to get it again and again
        socket.data.roomId = roomId;
        socket.data.username = user.username;

        await emitRoomUsers(io, roomId);

        const strokes = await loadBoard(roomId);

        console.log(`✅ ${socket.id} aka ${socket.data.username} joined ${roomId}`);

        return { ok: true, strokes };
    }, "Failed to join room");

    // Persist first, then broadcast the stored state; the sender gets the same state in its acknowledgement.
    on("stroke:add", async (data) => {
        const roomId = socket.data.roomId;

        if (!roomId) return NOT_JOINED;

        const stroke = sanitizeStroke(data?.stroke);

        if (!stroke) return rejectPayload("stroke:add", "Invalid stroke");

        const { stroke: saved } = await addStroke(roomId, stroke);

        socket.to(roomId).emit("stroke:changed", saved);

        return { ok: true, stroke: saved };
    });

    // Erase, undo and redo are all a delete or restore of one stroke, guarded by the rev the client last saw.
    const onVisibilityChange = (event, deleted) => {
        on(event, async (data) => {
            const roomId = socket.data.roomId;

            if (!roomId) return NOT_JOINED;

            if (!isValidStrokeId(data?.id) || !isValidRev(data?.baseRev)) {
                return rejectPayload(event, "Invalid stroke change");
            }

            const { stroke } = await setStrokeDeleted(roomId, data.id, data.baseRev, deleted);

            if (!stroke) return { ok: false, message: "Stroke not found" };

            socket.to(roomId).emit("stroke:changed", stroke);

            return { ok: true, stroke };
        });
    };

    onVisibilityChange("stroke:delete", true);
    onVisibilityChange("stroke:restore", false);

    // socket for recevieng and send the cursor details
    on("cursor-move", (payload) => {
        const roomId = socket.data.roomId;

        if (!roomId) return;

        const cursor = sanitizeCursor(payload, {
            id: socket.id,
            name: socket.data.username,
        });

        if (!cursor) {
            rejectPayload("cursor-move");
            return;
        }

        // Volatile: a dropped cursor position is replaced by the next one, so never queue them.
        socket.to(roomId).volatile.emit("cursor-move", cursor);
    });

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