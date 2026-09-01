import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const { login } = useAuth();

    const handleLogin = async () => {

        if (!email.trim() || !password.trim()) return;

        try {

            const data = await login(email, password);

            console.log("Login successful");

            navigate("/rooms");

        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white rounded-xl shadow-lg p-8 w-96">

                <h1 className="text-3xl font-bold mb-6">
                    CanvasSync
                </h1>

                <input
                    className="border rounded-lg w-full p-3 mb-4"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                />

                <input
                    type="password"
                    className="border rounded-lg w-full p-3 mb-4"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 text-white rounded-lg py-3"
                >
                    Login
                </button>

                <div className="text-center mt-5">

                    <p className="text-sm text-gray-500">
                        Don't have an account?
                    </p>

                    <button
                        onClick={() => navigate("/signup")}
                        className="text-blue-600 font-semibold mt-1"
                    >
                        Sign Up
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Home;