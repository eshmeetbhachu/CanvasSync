import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshAccessToken = useCallback(async () => {
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
            setUser(data.user);

            return data.accessToken;

        } catch (error) {
            console.error("Failed to refresh access token:", error);

            setAccessToken(null);
            setUser(null);

            return null;
        }
    }, []);

    useEffect(() => {

        const restoreSession = async () => {

            // refreshAccessToken already stores the full user (id, username, email).
            await refreshAccessToken();

            setLoading(false);
        };

        restoreSession();

    }, [refreshAccessToken]);

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

    // Creates the account, then logs straight in so the user lands on their dashboard.
    const signup = async (username, email, password) => {

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
            throw new Error(data.message || "Signup failed");
        }

        return login(email, password);
    };

    const authenticatedFetch = useCallback(async (url, options = {}) => {
        const request = (token) => fetch(url, {
            ...options,
            credentials: "include",
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
            },
        });

        let response = await request(accessToken);

        if (response.status !== 401) {
            return response;
        }

        const refreshedToken = await refreshAccessToken();

        if (!refreshedToken) {
            return response;
        }

        response = await request(refreshedToken);
        return response;
    }, [accessToken, refreshAccessToken]);

    const logout = async () => {
        try {
            await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/logout`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );
        } finally {
            setAccessToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                user,
                loading,
                login,
                signup,
                logout,
                refreshAccessToken,
                authenticatedFetch,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};