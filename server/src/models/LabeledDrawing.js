import mongoose from "mongoose";
import { DRAWING_LABELS } from "../constants/shapes.js";

const PointSchema = new mongoose.Schema(
    {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
    },
    { _id: false }
);

// One hand-drawn, single-stroke training example for the shape recognizer.
const LabeledDrawingSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            enum: DRAWING_LABELS,
            required: true,
        },
        // Raw stroke in drawing order; images are rendered from this later so the image size can change.
        points: {
            type: [PointSchema],
            required: true,
        },
        // Who drew it: the train/validation/test split is made per person.
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sessionId: {
            type: String,
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

LabeledDrawingSchema.index({ userId: 1, label: 1 });

const LabeledDrawing = mongoose.model("LabeledDrawing", LabeledDrawingSchema);

export default LabeledDrawing;
