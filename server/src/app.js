import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import roomRoutes from "./routes/room.routes.js";

import "dotenv/config";

const app = express();
console.log("CLIENT_URL:", process.env.CLIENT_URL);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

export default app;
