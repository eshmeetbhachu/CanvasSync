import express from "express";
import { createRoom, deleteRoom, getRoom, listRooms, renameRoom } from "../controllers/room.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, listRooms);
router.post("/", authMiddleware, createRoom);
router.get("/:roomId", authMiddleware, getRoom);
router.patch("/:roomId", authMiddleware, renameRoom);
router.delete("/:roomId", authMiddleware, deleteRoom);

export default router;
