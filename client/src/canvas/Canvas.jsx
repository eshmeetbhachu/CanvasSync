import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {drawBoard} from "../utils/render"
import { getMousePosition } from "../utils/geometry";
import Toolbar from "../components/Toolbar";
import createSocket from "../sockets/socket";
import OnlineUsers from "../components/Onlineusers";
import throttle from "../utils/throttle";
import RemoteCursor from "../components/RemoteCursor";
import { useAuth } from "../context/AuthContext";

function Canvas({roomId,onRoomError}) {

  const { accessToken, user } = useAuth();
  const socketRef = useRef(null);

  const navigate = useNavigate();

  // to send to the onlineusers.jsx for the left panel
  const [users,setUsers] = useState([]);

  // same as rooms for storing the cursor details
  const [cursors, setCursors] = useState({});

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // helps us to know if we are currectly drawing , used useref becasue it doesnt change the ui and update without rendering
  const isDrawing = useRef(false);

  // use both to store each stroke made. currentstroke stores the stroke attributes and board stores the strokes
  const currentStroke = useRef(null);
  const board = useRef([]);

  // using useref for color and width
  const currentColor = useRef("black");
  const currentStrokeWidth = useRef(4);

  // we create a redo-stack. since redos follow LIFO
  const redoStack = useRef([]);

  // we add another useref for eraser and other tool.
  const currentTool = useRef("pencil");

  // shifted mouse postion to geometry.js

  // making a helper function for rendering the board
  const render = () => {

    console.log(
        "RENDERING BOARD:",
        board.current.length,
        "current stroke:",
        currentStroke.current
    );

    drawBoard(
        contextRef.current,
        canvasRef.current,
        board.current,
        currentStroke.current
    );
  };

  // function for eraser
  const eraseStroke = (event) => {
    const { x, y } = getMousePosition(
    event,
    canvasRef.current
    );
    console.log("eraser function reached")

    for(let i=0;i < board.current.length; i++){
      const stroke = board.current[i];
      for(const point of stroke.points){
        const tolerance = 12;
        const dx = point.x-x;
        const dy = point.y-y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        if(distance<=tolerance){
          // get the erased stroke to send to other browsers
          const erasedStroke = board.current[i];
          board.current.splice(i,1);
          render();
          socketRef.current.emit("erase", erasedStroke.id);
          return
        }
      }
    }
  };

  const sendStrokes = () => {
    // emitting the stroke to the socket server so it broadcasts it
    socketRef.current.emit("stroke",currentStroke.current)
  }

  // making the finish stroke as a function so it can be used anywhere
  const finishStroke = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    redoStack.current = [];
    board.current.push(currentStroke.current);

    console.log("LOCAL BOARD AFTER STROKE:", board.current);

    sendStrokes();
    currentStroke.current = null;
    render();
  };

    // we will use throttle function for this
  const updateCursor = ({ x, y }) => {

    socketRef.current.emit("cursor-move", {
        id: socketRef.current.id,
        name: user.username,
        x,
        y,
    });
  };

  // adding throttle to the cursor movement req
  const throttledUpdateCursor = throttle(updateCursor, 50);

  const handleMouseDown = (event) => {
    console.log(currentTool)

    if (currentTool.current === "eraser") {
          eraseStroke(event);
          return;
    }

    isDrawing.current = true;
    const { x, y } = getMousePosition(
    event,
    canvasRef.current
    );

    // initaite the stroke with attributes
    currentStroke.current = {
      id: Date.now(),
      color: currentColor.current, // dynamic color storage
      strokeWidth: currentStrokeWidth.current,
      points: []
    }

    // push the start point of stroke to the currentstroke points
    currentStroke.current.points.push({x,y});
  };

  const handleMouseMove = (event) => {

    if(!isDrawing.current) return;
    const { x, y } = getMousePosition(
    event,
    canvasRef.current
    );
    throttledUpdateCursor({ x, y });  
    // push the points on each mouse move
    currentStroke.current.points.push({x,y});
    render();
  };

  const handleMouseUp = (event) => {
    finishStroke();
  };


  // shifted the draw board and draw stroke to render.js in utils

  const undo = () => {
    if (board.current.length === 0) return
    const removedStroke = board.current.pop();
    redoStack.current.push(removedStroke);
    render();
    console.log(redoStack.current);

    socketRef.current.emit("undo");
  }

  const redo = () => {
    if (redoStack.current.length === 0) return;
    const restoredStroke = redoStack.current.pop();
    board.current.push(restoredStroke);
    render();

    socketRef.current.emit("redo",restoredStroke);
  }

  const handleRoomError = ({ message }) => {
      onRoomError(message);
  };

  useEffect(() => {

    if (!accessToken) return;

    const socket = createSocket(accessToken);
    socketRef.current = socket;


    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";

    contextRef.current = context;

    const handleWindowMouseUp = () => {
        finishStroke();
    };

    window.addEventListener(
        "mouseup",
        handleWindowMouseUp
    );

    // saying hi to server from browser using .emit
        // means socket wants to join room with roomId
        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);

            socket.emit("join-room", {
                roomId
            });
        });

        // send the first msg with roomid
        socket.emit("hello",{
          message: "hello server !",
        });

        // get the reply from server
        socket.on("welcome",(msg) => {
          console.log(msg);
        })

        // getting the users from the server rather than using the frontend 
        socket.on("room-users", (users) => {
            console.log(users);
            setUsers(users);
        });
 
    // receive the strokes from the original sender via the socket server
    socket.on("stroke",(stroke) => {
      console.log("Received stroke", stroke);
       board.current.push(stroke);
       render();
    })

    // gets the socket details and adds them to the state, also we dont add we assign
    socket.on("cursor-move", (cursor) => {
      console.log(cursor);
        setCursors((prev) => ({
            ...prev,
            [cursor.id]: cursor,
        }));
    });

    // to remove the disconneted socket id cursor details.
    // we use this method to create new obj and not directly use delete
    socket.on("cursor-remove", ({ id }) => {
        setCursors((prev) => {
            const { [id]: removedCursor, ...remaining } = prev;
            return remaining;
        });
    });

    // receiving the strokes from the mongodb database
    socket.on("board-data", (strokes) => {
        board.current = strokes;
        render();
    });

    // receiving the stroke erased and then updating the board.current
    socket.on("erase", (strokeId) => {
        board.current = board.current.filter(
            stroke => stroke.id !== strokeId
        );
        render();
    });

    // the same undo code for all the other boards
    socket.on("undo", () => {
        if (board.current.length === 0) return;
        const removedStroke = board.current.pop();
        redoStack.current.push(removedStroke);
        render();
    });

    socket.on("redo", () => {
        if (redoStack.current.length === 0) return;
        const restoredStroke = redoStack.current.pop();
        board.current.push(restoredStroke);
        render();
    });

    socket.on("room-error", handleRoomError);

    return () => {
        window.removeEventListener(
            "mouseup",
            handleWindowMouseUp
        );

        socket.off("welcome");
        socket.off("room-users");
        socket.off("stroke");
        socket.off("cursor-move");
        socket.off("cursor-remove");
        socket.off("board-data");
        socket.off("erase");
        socket.off("undo");
        socket.off("redo");
        socket.off("room-error", handleRoomError);

        socket.disconnect();
        socketRef.current = null;
    };
  }, [accessToken,roomId]);


  return (
    <>
    <div className="flex gap-6 px-8 pb-8 pt-5">
    
    {/* left online participant panel */}
     <OnlineUsers
    users={users}
    username={user?.username}
    />

    {/* canvas */}
    <div className="relative flex-1 bg-white rounded-2xl border border-gray-200 shadow-lg p-4 overflow-hidden">
    <canvas
      ref={canvasRef}
      width={950}
      height={650}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    />
    {/*helps make the box over the cursor */}
    {Object.values(cursors).map((cursor) => (
        <RemoteCursor
            key={cursor.id}
            cursor={cursor}
        />
    ))}
    </div>

    {/* right toolbar */}
    <div className="w-72 shrink-0 bg-white rounded-2xl shadow-lg p-6 space-y-1 flex flex-col gap-8 h-fit">
    <Toolbar 
    currentColor={currentColor}
    currentStrokeWidth={currentStrokeWidth}
    currentTool={currentTool}
    undo={undo}
    redo={redo}/>
    </div>
    </div>
    </>
    
  );
}

export default Canvas;

// address the syncronization 