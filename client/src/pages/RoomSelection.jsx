import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RoomSelection() {

    const [boardName, setBoardName] = useState("");
    const [roomId, setRoomId] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const { accessToken, user } = useAuth();

    const handleCreateRoom = async () => {

        if (!boardName.trim()) return;

        try {
            setError("");

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/rooms`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        name: boardName,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Failed to create board");
                return;
            }

            navigate(`/board/${data.room.roomId}`);

        } catch (error) {
            console.error("Create room failed:", error);
            setError("Unable to create board");
        }
    };

    const handleJoinRoom = () => {

        if (!roomId.trim()) return;

        navigate(`/board/${roomId.trim()}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white rounded-xl shadow-lg p-8 w-96">

                <h1 className="text-3xl font-bold mb-2">
                    CanvasSync
                </h1>

                <p className="text-gray-500 mb-8">
                    Welcome, {user?.username}
                </p>

                {/* CREATE */}

                <h2 className="font-semibold mb-3">
                    Create a Board
                </h2>

                <input
                    className="border rounded-lg w-full p-3 mb-3"
                    placeholder="Board name"
                    value={boardName}
                    onChange={(e) =>
                        setBoardName(e.target.value)
                    }
                />

                <button
                    onClick={handleCreateRoom}
                    className="w-full bg-blue-600 text-white rounded-lg py-3"
                >
                    Create Board
                </button>

                <div className="flex items-center gap-3 my-8">
                    <div className="h-px bg-gray-300 flex-1" />
                    <span className="text-gray-400 text-sm">
                        OR
                    </span>
                    <div className="h-px bg-gray-300 flex-1" />
                </div>

                {/* JOIN */}

                <h2 className="font-semibold mb-3">
                    Join a Board
                </h2>

                <input
                    className="border rounded-lg w-full p-3 mb-3"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) =>
                        setRoomId(e.target.value)
                    }
                />

                <button
                    onClick={handleJoinRoom}
                    className="w-full bg-gray-800 text-white rounded-lg py-3"
                >
                    Join Board
                </button>

                {error && (
                    <p className="text-red-500 text-sm mt-4">
                        {error}
                    </p>
                )}

            </div>

        </div>
    );
}

export default RoomSelection;