import { useRef, useEffect } from "react";
import {drawBoard} from "../utils/render"
import { getMousePosition } from "../utils/geometry";
import Toolbar from "../components/Toolbar";

function Canvas() {
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

  // making the finish stroke as a function so it can be used anywhere
  const finishStroke = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    redoStack.current = [];
    board.current.push(currentStroke.current);
    currentStroke.current = null;
    render();
  };

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
    // push the points on each mouse move
    currentStroke.current.points.push({x,y});
    render();
  };

  const handleMouseUp = (event) => {
    finishStroke();
  };

  // shifted the sraw board and draw dtroke to render.js in utils

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

    return () => {
        window.removeEventListener(
            "mouseup",
            handleWindowMouseUp
        );
    };
  }, []);

  return (
    <>
    <div className="flex items-center justify-between pt-2 mx-8">
        <div>
            <h1 className="text-4xl font-bold text-gray-800">
                Collaborative Whiteboard
            </h1>

            <p className="text-gray-500 mt-1">
                Draw • Collaborate • Create
            </p>
        </div>

        <div className="bg-white rounded-full shadow px-5 py-2 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>

            <span className="text-sm font-medium text-gray-700">
                Local Mode
            </span>
        </div>
    </div>

    <div className="flex justify-center gap-6 px-8 pb-8 pt-5">
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-lg p-4 overflow-hidden">
    <canvas
      ref={canvasRef}
      width={950}
      height={650}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    />
    </div>
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