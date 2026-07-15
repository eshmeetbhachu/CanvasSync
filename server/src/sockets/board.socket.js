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
    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        // stored the roomid in extra storage of socket so we dont have to get it again and again
        socket.data.roomId = roomId;
        console.log(`✅ ${socket.id} joined ${roomId}`);
    });

    // adding the handler for getting strokes
    socket.on("stroke",(stroke) => {
        socket.broadcast.to(socket.data.roomId).emit("stroke",stroke);
    })
};

export default registerBoardSocket;