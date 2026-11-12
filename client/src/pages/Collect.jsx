import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DRAWING_LABELS } from "../constants/shapes";
import { drawSegment } from "../utils/render";
import { getMousePosition } from "../utils/geometry";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const MIN_POINTS = 2;
const MAX_POINTS = 2000;
const PEN = { color: "black", strokeWidth: 4 };

const HINTS = {
    other: "Draw anything that is NOT one of the shapes: a scribble, a letter, a squiggle.",
    arrow: "Draw an arrow in one stroke, without lifting the mouse.",
};

function Collect() {

    const { authenticatedFetch } = useAuth();
    const navigate = useNavigate();

    const [label, setLabel] = useState(DRAWING_LABELS[0]);
    const [counts, setCounts] = useState({});
    const [lastSaved, setLastSaved] = useState(null);
    const [status, setStatus] = useState("");

    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const points = useRef(null);
    const labelRef = useRef(label);

    // one id per visit, so drawings made in the same sitting can be grouped later
    const sessionId = useRef(crypto.randomUUID());

    useEffect(() => {
        const context = canvasRef.current.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";
        contextRef.current = context;
    }, []);

    const clearCanvas = () => {
        contextRef.current?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    const chooseLabel = (next) => {
        labelRef.current = next;
        setLabel(next);
        setStatus("");
        clearCanvas();
    };

    const saveDrawing = async (drawingPoints, drawingLabel) => {
        try {
            const response = await authenticatedFetch(
                `${import.meta.env.VITE_API_URL}/api/drawings`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        label: drawingLabel,
                        points: drawingPoints,
                        sessionId: sessionId.current,
                    }),
                }
            );

            if (!response.ok) {
                setStatus("Could not save that drawing. Please try again.");
                return;
            }

            const data = await response.json();

            setLastSaved({ id: data.id, label: drawingLabel });
            setCounts((previous) => ({
                ...previous,
                [drawingLabel]: (previous[drawingLabel] ?? 0) + 1,
            }));
            setStatus(`Saved ${drawingLabel}. Draw another one.`);
            clearCanvas();

        } catch (error) {
            console.error("Save drawing failed:", error);
            setStatus("Could not save that drawing. Please try again.");
        }
    };

    const undoLast = async () => {
        if (!lastSaved) return;

        try {
            const response = await authenticatedFetch(
                `${import.meta.env.VITE_API_URL}/api/drawings/${lastSaved.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                setStatus("Could not remove the last drawing.");
                return;
            }

            setCounts((previous) => ({
                ...previous,
                [lastSaved.label]: Math.max(0, (previous[lastSaved.label] ?? 1) - 1),
            }));
            setStatus(`Removed the last ${lastSaved.label}.`);
            setLastSaved(null);

        } catch (error) {
            console.error("Delete drawing failed:", error);
            setStatus("Could not remove the last drawing.");
        }
    };

    const handleMouseDown = (event) => {
        clearCanvas();
        points.current = [getMousePosition(event, canvasRef.current)];
    };

    const handleMouseMove = (event) => {
        if (!points.current || points.current.length >= MAX_POINTS) return;

        const point = getMousePosition(event, canvasRef.current);
        const previous = points.current[points.current.length - 1];

        points.current.push(point);
        drawSegment(contextRef.current, PEN, previous, point);
    };

    const finishDrawing = () => {
        const drawingPoints = points.current;
        points.current = null;

        if (!drawingPoints) return;

        if (drawingPoints.length < MIN_POINTS) {
            setStatus("That was just a click. Hold the mouse down and draw.");
            return;
        }

        saveDrawing(drawingPoints, labelRef.current);
    };

    // the listener is added once, so it calls through a ref to always use the latest login token
    const finishRef = useRef(finishDrawing);
    finishRef.current = finishDrawing;

    // releasing the mouse outside the canvas still ends the stroke
    useEffect(() => {
        const handleMouseUp = () => finishRef.current();

        window.addEventListener("mouseup", handleMouseUp);

        return () => window.removeEventListener("mouseup", handleMouseUp);
    }, []);

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6">

            <div className="bg-white rounded-xl shadow-lg p-8">

                <h1 className="text-2xl font-bold mb-1">
                    Help train the shape recognizer
                </h1>

                <p className="text-gray-500 text-sm mb-4">
                    Your drawings are saved with your account ID and used to train a shape-recognition model for CanvasSync.
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                    {DRAWING_LABELS.map((name) => (
                        <button
                            key={name}
                            onClick={() => chooseLabel(name)}
                            className={`px-3 py-2 rounded-lg text-sm capitalize cursor-pointer ${
                                label === name
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 hover:bg-blue-100"
                            }`}
                        >
                            {name} ({counts[name] ?? 0})
                        </button>
                    ))}
                </div>

                <p className="font-semibold mb-2">
                    {HINTS[label] ?? `Draw a ${label} in one stroke, without lifting the mouse.`}
                </p>

                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    className="border rounded-lg cursor-crosshair"
                />

                <div className="flex items-center justify-between mt-3">

                    <p className="text-sm text-gray-600">
                        {status || `Saved this visit: ${total}`}
                    </p>

                    <div className="flex gap-2">
                        <button
                            onClick={undoLast}
                            disabled={!lastSaved}
                            className="bg-gray-100 rounded-lg px-3 py-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-default"
                        >
                            Undo last
                        </button>

                        <button
                            onClick={() => navigate("/dashboard")}
                            className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm cursor-pointer"
                        >
                            Back to dashboard
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Collect;
