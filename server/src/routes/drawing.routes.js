import express from "express";
import { createDrawing, deleteDrawing } from "../controllers/drawing.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createDrawing);
router.delete("/:id", authMiddleware, deleteDrawing);

export default router;
