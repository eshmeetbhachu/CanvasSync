import Canvas from "./canvas/Canvas";

// saying hi to server from browser using .emit
import { useEffect } from "react";
import socket from "./sockets/socket";

function App() {

  // saying hi to server from browser using .emit
  useEffect(() => {

    const roomId = prompt("Enter Room ID");

    // means socket wants to join room with roomId
    socket.emit("join-room",roomId);

    // send the first msg with roomid
    socket.emit("hello",{
      message: "hello server !",
    });

    // get the reply from server
    socket.on("welcome",(msg) => {
      console.log(msg);
    })
},[]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Canvas />
    </div>
  );
}

export default App;