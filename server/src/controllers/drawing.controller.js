import mongoose from "mongoose";
import LabeledDrawing from "../models/LabeledDrawing.js";
import { sanitizeLabeledDrawing } from "../validators/drawing.validator.js";

export const createDrawing = async (req, res) => {
    try {
        const drawing = sanitizeLabeledDrawing(req.body);

        if (!drawing) {
            return res.status(400).json({
                message: "Invalid drawing",
            });
        }

        // The author always comes from the verified token, never from the request body.
        const saved = await LabeledDrawing.create({
            ...drawing,
            userId: req.userId,
        });

        return res.status(201).json({
            id: saved._id,
        });

    } catch (error) {
        console.error("Save drawing failed:", error);

        return res.status(500).json({
            message: "Failed to save drawing",
        });
    }
};

// Lets a contributor remove a drawing they got wrong; only their own.
export const deleteDrawing = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid drawing id",
            });
        }

        const deleted = await LabeledDrawing.findOneAndDelete({
            _id: id,
            userId: req.userId,
        });

        if (!deleted) {
            return res.status(404).json({
                message: "Drawing not found",
            });
        }

        return res.status(204).send();

    } catch (error) {
        console.error("Delete drawing failed:", error);

        return res.status(500).json({
            message: "Failed to delete drawing",
        });
    }
};
