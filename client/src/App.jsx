import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Collect from "./pages/Collect";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/board/:roomId" element={<ProtectedRoute><Board /></ProtectedRoute>} />
            <Route path="/collect" element={<ProtectedRoute><Collect /></ProtectedRoute>} />
            {/* Old address from before the dashboard existed. */}
            <Route path="/rooms" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
