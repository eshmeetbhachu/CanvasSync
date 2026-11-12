import crypto from "crypto";
import Board from "../models/Board.js";
import Room from "../models/Room.js";
import Stroke from "../models/Stroke.js";
import { isValidRoomId } from "../validators/board.validator.js";
import { sanitizeRoomName } from "../validators/room.validator.js";

const toClientRoom = (room, userId) => ({
    roomId: room.roomId,
    name: room.name,
    isOwner: String(room.ownerId) === String(userId),
    createdAt: room.createdAt,
    // Rooms created before updatedAt existed fall back to their creation time.
    updatedAt: room.updatedAt ?? room.createdAt,
});

const invalidName = (res) =>
    res.status(400).json({
        message: "Board name must be 1 to 60 characters",
    });

// Not-owned and missing boards get the same answer, so the API never confirms someone else's board exists.
const notFound = (res) =>
    res.status(404).json({
        message: "Board not found",
    });

export const createRoom = async (req, res) => {
    try {
        const name = sanitizeRoomName(req.body?.name);

        if (!name) return invalidName(res);

        const roomId = crypto.randomBytes(6).toString("hex");

        const room = await Room.create({
            roomId,
            ownerId: req.userId,
            name,
        });

        return res.status(201).json({
            message: "Room created successfully",
            room: toClientRoom(room, req.userId),
        });

    } catch (error) {
        console.error("Create room failed:", error);

        return res.status(500).json({
            message: "Failed to create room",
        });
    }
};

export const listRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ ownerId: req.userId })
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean();

        return res.status(200).json({
            rooms: rooms.map((room) => toClientRoom(room, req.userId)),
        });

    } catch (error) {
        console.error("List rooms failed:", error);

        return res.status(500).json({
            message: "Failed to load boards",
        });
    }
};

export const renameRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!isValidRoomId(roomId)) return notFound(res);

        const name = sanitizeRoomName(req.body?.name);

        if (!name) return invalidName(res);

        const room = await Room.findOneAndUpdate(
            { roomId, ownerId: req.userId },
            { $set: { name } },
            { returnDocument: "after" }
        ).lean();

        if (!room) return notFound(res);

        return res.status(200).json({
            room: toClientRoom(room, req.userId),
        });

    } catch (error) {
        console.error("Rename room failed:", error);

        return res.status(500).json({
            message: "Failed to rename board",
        });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!isValidRoomId(roomId)) return notFound(res);

        const { deletedCount } = await Room.deleteOne({ roomId, ownerId: req.userId });

        if (deletedCount === 0) return notFound(res);

        // The room is gone first, so no new strokes can be added while its old ones are removed.
        await Stroke.deleteMany({ roomId });
        await Board.deleteOne({ roomId });

        return res.status(204).send();

    } catch (error) {
        console.error("Delete room failed:", error);

        return res.status(500).json({
            message: "Failed to delete board",
        });
    }
};
