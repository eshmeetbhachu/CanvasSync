import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "./FullPageLoader";

// Signed-out visitors go to the login page, which sends them back here afterwards.
function ProtectedRoute({ children }) {
    const { accessToken, loading } = useAuth();
    const location = useLocation();

    if (loading) return <FullPageLoader />;

    if (!accessToken) {
        return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
    }

    return children;
}

export default ProtectedRoute;
