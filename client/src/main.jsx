import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "./context/AuthContext";
import './index.css'
import App from './App.jsx'
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
            <App />
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: { background: "#11120D", color: "#FFFBF4", borderRadius: "999px", fontSize: "14px" },
                success: { iconTheme: { primary: "#D8CFBC", secondary: "#11120D" } },
              }}
            />
    </AuthProvider>
  </StrictMode>,
)
