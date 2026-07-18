import { useRef, useEffect, useState } from "react";
import {drawBoard} from "../utils/render"
import { getMousePosition } from "../utils/geometry";
import Toolbar from "../components/Toolbar";
import socket from "../sockets/socket";
import OnlineUsers from "../components/Onlineusers";
import throttle from "../utils/throttle";
import RemoteCursor from "../components/RemoteCursor";

function Canvas({roomId,username}) {

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

    for(let i=0;i < board.current.length; i++){
      const stroke = board.current[i];
      for(const point of stroke.points){
        const tolerance = 12;
        const dx = point.x-x;
        const dy = point.y-y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        if(distance<=tolerance){
          board.current.splice(i,1);
          render();
          return
        }
      }
    }
  };

  const sendStrokes = () => {
    // emitting the stroke to the socket server so it broadcasts it
    socket.emit("stroke",currentStroke.current)
  }

  // making the finish stroke as a function so it can be used anywhere
  const finishStroke = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    redoStack.current = [];
    board.current.push(currentStroke.current);

    sendStrokes();
    currentStroke.current = null;
    render();
  };

    // we will use throttle function for this
  const updateCursor = ({ x, y }) => {

    socket.emit("cursor-move", {
        id: socket.id,
        name: username,
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
  }

  const redo = () => {
    if (redoStack.current.length === 0) return;
    const restoredStroke = redoStack.current.pop();
    board.current.push(restoredStroke);
    render();
  }

  useEffect(() => {
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
        socket.emit("join-room",{
          roomId,
          username
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
      console.log("📥 Received stroke", stroke);
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

    return () => {
        window.removeEventListener(
            "mouseup",
            handleWindowMouseUp
        );
    };
  }, []);


  return (
    <>
    <div className="flex gap-6 px-8 pb-8 pt-5">
    
    {/* left online participant panel */}
     <OnlineUsers
    users={users}
    username={username}
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