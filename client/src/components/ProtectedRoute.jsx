import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
    const { accessToken, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Checking authentication...
            </div>
        );
    }

    if (!accessToken) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return children;
}

export default ProtectedRoute;
