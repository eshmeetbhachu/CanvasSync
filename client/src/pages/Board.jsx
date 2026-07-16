import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Canvas from "../canvas/Canvas";

function Board() {

    const { roomId } = useParams();
    const [copied, setCopied] = useState(false);

    // getting the state from the navigation
    const location = useLocation();
    const username = location.state?.username;

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

            <div className="flex items-center justify-between px-8 py-4">

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

            <Canvas roomId={roomId} username={username} />

        </div>
    );
}

export default Board;