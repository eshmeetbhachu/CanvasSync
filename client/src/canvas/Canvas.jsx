import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { drawBoard, drawSegment } from "../utils/render";
import { getMousePosition } from "../utils/geometry";
import Toolbar from "../components/Toolbar";
import createSocket from "../sockets/socket";
import OnlineUsers from "../components/Onlineusers";
import throttle from "../utils/throttle";
import RemoteCursors from "../components/RemoteCursors";
import { useAuth } from "../context/AuthContext";
import { createBoardSync } from "./boardSync";

const CURSOR_INTERVAL_MS = 100;
const ERASER_TOLERANCE = 12;

function Canvas({roomId,onRoomError}) {

  const { accessToken, user, refreshAccessToken } = useAuth();
  const socketRef = useRef(null);
  const syncRef = useRef(null);
  const cursorsRef = useRef(null);

  const navigate = useNavigate();

  // to send to the onlineusers.jsx for the left panel
  const [users,setUsers] = useState([]);

  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // helps us to know if we are currectly drawing , used useref becasue it doesnt change the ui and update without rendering
  const isDrawing = useRef(false);

  // the stroke being drawn right now; finished strokes live in the board sync
  const currentStroke = useRef(null);

  // using useref for color and width
  const currentColor = useRef("black");
  const currentStrokeWidth = useRef(4);

  // we add another useref for eraser and other tool.
  const currentTool = useRef("pencil");

  // redraws every visible stroke plus the one being drawn
  const render = () => {
    if (!contextRef.current) return;

    drawBoard(
        contextRef.current,
        canvasRef.current,
        syncRef.current?.visibleStrokes() ?? [],
        currentStroke.current
    );
  };

  // function for eraser
  const eraseStroke = (event) => {
    const { x, y } = getMousePosition(
    event,
    canvasRef.current
    );

    for (const stroke of syncRef.current?.visibleStrokes() ?? []) {
      for (const point of stroke.points) {
        const dx = point.x - x;
        const dy = point.y - y;

        if (Math.sqrt(dx * dx + dy * dy) <= ERASER_TOLERANCE) {
          syncRef.current.eraseStroke(stroke.id);
          return;
        }
      }
    }
  };

  // making the finish stroke as a function so it can be used anywhere
  const finishStroke = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;

    const stroke = currentStroke.current;
    currentStroke.current = null;

    syncRef.current?.addStroke(stroke);
    render();
  };

  // created once so the throttle keeps its timer across re-renders
  const throttledUpdateCursor = useMemo(
    () =>
      throttle(({ x, y }) => {
        const socket = socketRef.current;

        if (!socket || !syncRef.current?.isJoined()) return;

        socket.volatile.emit("cursor-move", { x, y });
      }, CURSOR_INTERVAL_MS),
    []
  );

  const handleMouseDown = (event) => {
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
      id: crypto.randomUUID(),
      color: currentColor.current, // dynamic color storage
      strokeWidth: currentStrokeWidth.current,
      points: [{ x, y }]
    }
  };

  const handleMouseMove = (event) => {

    if(!isDrawing.current) return;
    const { x, y } = getMousePosition(
    event,
    canvasRef.current
    );
    throttledUpdateCursor({ x, y });

    const points = currentStroke.current.points;
    const previous = points[points.length - 1];
    points.push({ x, y });

    // only the new segment needs drawing; a full redraw happens when the board changes
    drawSegment(contextRef.current, currentStroke.current, previous, { x, y });
  };

  const handleMouseUp = () => {
    finishStroke();
  };

  const undo = () => syncRef.current?.undo();

  const redo = () => syncRef.current?.redo();

  // The board sync outlives socket reconnections and token refreshes, so unsent changes are kept.
  useEffect(() => {
    const context = canvasRef.current.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    contextRef.current = context;

    const sync = createBoardSync({
      roomId,
      onChange: render,
      onJoinError: onRoomError,
    });
    syncRef.current = sync;
    render();

    const handleWindowMouseUp = () => {
        finishStroke();
    };

    window.addEventListener(
        "mouseup",
        handleWindowMouseUp
    );

    return () => {
      window.removeEventListener(
          "mouseup",
          handleWindowMouseUp
      );
      sync.destroy();
      syncRef.current = null;
    };
    // render and finishStroke only read refs, so they are safe to capture once per room
  }, [roomId, onRoomError]);

  useEffect(() => {

    if (!accessToken) return;

    const socket = createSocket(accessToken);
    socketRef.current = socket;
    let refreshAttempted = false;

    syncRef.current?.attach(socket);

        socket.on("connect", () => {
            // cursors from before a reconnect may belong to users who have since left
            cursorsRef.current?.clear();
        });

        socket.on("connect_error", async (error) => {
            if (
                refreshAttempted ||
                !error.message.toLowerCase().includes("token")
            ) {
                return;
            }

            refreshAttempted = true;
            socket.disconnect();

            const refreshedToken = await refreshAccessToken();

            if (!refreshedToken) {
                navigate("/");
            }
        });

        // getting the users from the server rather than using the frontend
        socket.on("room-users", setUsers);

    socket.on("cursor-move", (cursor) => {
        cursorsRef.current?.move(cursor);
    });

    // to remove the disconneted socket id cursor details.
    socket.on("cursor-remove", ({ id }) => {
        cursorsRef.current?.remove(id);
    });

    socket.connect();

    return () => {
        syncRef.current?.detach();
        socket.off("connect");
        socket.off("connect_error");
        socket.off("room-users");
        socket.off("cursor-move");
        socket.off("cursor-remove");

        socket.disconnect();
        socketRef.current = null;
    };
  }, [accessToken, roomId, navigate, refreshAccessToken]);


  return (
    <>
    <div className="flex gap-6 px-3 pb-5 pt-5">

    {/* left online participant panel */}
     <OnlineUsers
    users={users}
    username={user?.username}
    />

    {/* canvas */}
    <div className="relative flex-1 bg-white rounded-2xl shadow-lg p-4 h-[450px] overflow-auto">
    <canvas
      ref={canvasRef}
      width={2000}
      height={1200}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    />
    {/*helps make the box over the cursor */}
    <RemoteCursors ref={cursorsRef} />
    </div>

    {/* right toolbar */}
    <div className="w-50 shrink-0 bg-white rounded-2xl shadow-lg p-4 space-y-1 flex flex-col gap-5 h-fit">
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
