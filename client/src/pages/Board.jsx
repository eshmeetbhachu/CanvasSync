import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Canvas from "../canvas/Canvas";

function Board() {

    const { roomId } = useParams();
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const [roomError, setRoomError] = useState("");


    const copyInviteLink = async () => {

        const url = window.location.href;

        await navigator.clipboard.writeText(url);

        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 2000);

    };

    return (
    <div className="min-h-screen bg-gray-100">

    {roomError ? (

        <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 w-96 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Unable to Join Board
                </h2>

                <p className="text-red-500 mb-6">
                    {roomError}
                </p>

                <button
                    onClick={() => navigate("/rooms")}
                    className="w-full bg-blue-600 text-white rounded-lg py-3"
                >
                    Back to Rooms
                </button>
            </div>
        </div>

    ) : (

        <>
            <div className="flex items-center justify-between px-8 py-3">

                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Collaborative Whiteboard
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Draw • Collaborate • Create
                    </p>
                </div>

                <div className="bg-white rounded-full shadow px-4 py-2 flex items-center gap-2">

                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>

                    <span className="text-sm font-medium text-gray-700">
                        Connected
                    </span>

                </div>

            </div>


            <div className="mx-8 bg-white rounded-xl shadow px-5 py-2 flex justify-between items-center">

                <div>
                    <p className="text-gray-500 text-sm">
                        Room ID
                    </p>

                    <h2 className="text-xl font-semibold">
                        {roomId}
                    </h2>
                </div>

                <button
                    onClick={copyInviteLink}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition"
                >
                    {copied ? "Copied!" : "📋 Copy Invite Link"}
                </button>

            </div>

            <Canvas
                roomId={roomId}
                onRoomError={setRoomError}
            />
        </>

    )}

</div>
);
}

export default Board;