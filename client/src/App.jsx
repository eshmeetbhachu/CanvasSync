// routing imports
import { BrowserRouter,Route,Routes } from "react-router-dom";

// importing the pages used:
import Home from "./pages/Home";
import Board from "./pages/Board";
import RoomSelection from "./pages/RoomSelection";
import Signup from "./pages/Signup";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/rooms" element={<RoomSelection />} />
            <Route path="/board/:roomId" element={<Board />}  />
        </Routes>
    </BrowserRouter>
  );
}
``
export default App;