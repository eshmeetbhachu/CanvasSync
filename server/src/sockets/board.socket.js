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
    socket.on("join-room", (data) => {
        socket.join(data.roomId);
        // stored the roomid in extra storage of socket so we dont have to get it again and again
        socket.data.roomId = data.roomId;
        socket.data.username = data.username;
        if (!rooms[data.roomId]) {
        rooms[data.roomId] = [];
        }

        rooms[data.roomId].push(data.username);

        io.to(data.roomId).emit("room-users",rooms[data.roomId]);

        console.log(`✅ ${socket.id} aka ${data.username} joined ${data.roomId}`);
    });

    // adding the handler for getting strokes
    socket.on("stroke",(stroke) => {
        socket.broadcast.to(socket.data.roomId).emit("stroke",stroke);
    })

    // for the disconnection
    socket.on("disconnect", () => {
        const roomId = socket.data.roomId;
        const username = socket.data.username;

        if (!roomId || !rooms[roomId]) return;

        rooms[roomId] =
            rooms[roomId].filter(
                (user) => user !== username
            );

        io.to(roomId).emit(
            "room-users",
            rooms[roomId]
        );
    });
};

export default registerBoardSocket;