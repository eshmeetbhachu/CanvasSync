// routing imports
import { BrowserRouter,Route,Routes } from "react-router-dom";

// importing the pages used:
import Home from "./pages/Home";
import Board from "./pages/Board";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/board/:roomId" element={<Board />}  />
        </Routes>
    </BrowserRouter>
  );
}

export default App;