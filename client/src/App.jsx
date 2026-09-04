// routing imports
import { BrowserRouter,Route,Routes } from "react-router-dom";

// importing the pages used:
import Home from "./pages/Home";
import Board from "./pages/Board";
import RoomSelection from "./pages/RoomSelection";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/rooms"
              element={
                <ProtectedRoute>
                  <RoomSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/board/:roomId"
              element={
                <ProtectedRoute>
                  <Board />
                </ProtectedRoute>
              }
            />
        </Routes>
    </BrowserRouter>
  );
}

export default App;