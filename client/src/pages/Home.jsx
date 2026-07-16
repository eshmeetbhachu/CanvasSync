import { use, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {

    const [roomId, setRoomId] = useState("");
    const [username, setUsername] = useState("");

    const navigate = useNavigate();

    const handleJoinRoom = () => {

        if (!roomId.trim()) return;

        navigate(`/board/${roomId}`,{
            // sending the name without adding it to the url
            state:{
                username 
            }
        });

    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white rounded-xl shadow-lg p-8 w-96">

                <h1 className="text-3xl font-bold mb-6">
                    CanvasSync
                </h1>

                <input
                    className="border rounded-lg w-full p-3 mb-4"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) =>
                        setUsername(e.target.value)
                    }
                />

                <input
                    className="border rounded-lg w-full p-3 mb-4"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) =>
                        setRoomId(e.target.value)
                    }
                />

                <button
                    onClick={handleJoinRoom}
                    className="w-full bg-blue-600 text-white rounded-lg py-3"
                >
                    Join Room
                </button>

            </div>

        </div>
    );
}

export default Home;