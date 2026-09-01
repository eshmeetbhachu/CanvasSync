import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshAccessToken = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                setAccessToken(null);
                setUser(null);
                return null;
            }

            const data = await response.json();

            setAccessToken(data.accessToken);

            return data.accessToken;

        } catch (error) {
            console.error("Failed to refresh access token:", error);

            setAccessToken(null);
            setUser(null);

            return null;
        }
    };

    useEffect(() => {

        const restoreSession = async () => {

            const token = await refreshAccessToken();

            if (token) {
                try {
                    const payload = JSON.parse(
                        atob(token.split(".")[1])
                    );

                    setUser({
                        id: payload.userId,
                    });

                } catch (error) {
                    console.error("Failed to decode token:", error);
                }
            }

            setLoading(false);
        };

        restoreSession();

    }, []);

    const login = async (email, password) => {

        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    password,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        setAccessToken(data.accessToken);
        setUser(data.user);

        return data;
    };

    const logout = async () => {

        setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                user,
                loading,
                login,
                logout,
                refreshAccessToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};