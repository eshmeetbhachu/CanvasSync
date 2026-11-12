import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "./FullPageLoader";

// Login and sign-up pages: once signed in, continue to where the user was headed, or the dashboard.
function PublicOnlyRoute({ children }) {
    const { accessToken, loading } = useAuth();
    const location = useLocation();

    if (loading) return <FullPageLoader />;

    if (accessToken) {
        const from = location.state?.from;
        const target = typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";

        return <Navigate to={target} replace />;
    }

    return children;
}

export default PublicOnlyRoute;
