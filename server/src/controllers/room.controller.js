import crypto from "crypto";
import Room from "../models/Room.js";
import Board from "../models/Board.js";

export const createRoom = async (req, res) => {
    try {
        const roomId = crypto.randomBytes(6).toString("hex");

        const room = await Room.create({
            roomId,
            ownerId: req.userId,
            name: req.body.name,
        });

        await Board.create({
            roomId,
            strokes: [],
        });

        return res.status(201).json({
            message: "Room created successfully",
            room: {
                roomId: room.roomId,
                name: room.name,
                ownerId: room.ownerId,
                createdAt: room.createdAt,
            },
        });

    } catch (error) {
        console.error("Create room failed:", error);

        return res.status(500).json({
            message: "Failed to create room",
        });
    }
};