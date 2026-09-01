import express from "express";
import { createRoom } from "../controllers/room.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createRoom);

export default router;