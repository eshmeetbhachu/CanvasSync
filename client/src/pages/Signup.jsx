import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSignup = async () => {

        if (!username.trim() || !email.trim() || !password.trim()) {
            setError("Username, email and password are required");
            return;
        }

        try {
            setError("");

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/signup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Signup failed");
                return;
            }

            console.log("Signup successful");

            // After signup, go back to login
            navigate("/");

        } catch (error) {
            console.error("Signup failed:", error);
            setError("Unable to create account");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white rounded-xl shadow-lg p-8 w-96">

                <h1 className="text-3xl font-bold mb-6">
                    Create Account
                </h1>

                <input
                    className="border rounded-lg w-full p-3 mb-4"
                    placeholder="Username"
                    value={username}
                    onChange={(e) =>
                        setUsername(e.target.value)
                    }
                />

                <input
                    className="border rounded-lg w-full p-3 mb-4"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                />

                <input
                    className="border rounded-lg w-full p-3 mb-4"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <button
                    onClick={handleSignup}
                    className="w-full bg-blue-600 text-white rounded-lg py-3"
                >
                    Create Account
                </button>

                {error && (
                    <p className="text-red-500 text-sm mt-4">
                        {error}
                    </p>
                )}

                <button
                    onClick={() => navigate("/")}
                    className="w-full mt-4 text-gray-600"
                >
                    Back to Login
                </button>

            </div>

        </div>
    );
}

export default Signup;