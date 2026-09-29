import mongoose from "mongoose";

const PointSchema = new mongoose.Schema(
    {
        x: {
            type: Number,
            required: true,
        },
        y: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const StrokeSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
    },
    strokeId: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    strokeWidth: {
        type: Number,
        required: true,
    },
    points: {
        type: [PointSchema],
        required: true,
    },
    // Position in the room's drawing order; fixed when the stroke is created.
    seq: {
        type: Number,
        required: true,
    },
    // Room seq of the latest change to this stroke; clients keep the highest rev they have seen.
    rev: {
        type: Number,
        required: true,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

// Makes stroke:add idempotent: a retried add hits this index instead of inserting a duplicate.
StrokeSchema.index({ roomId: 1, strokeId: 1 }, { unique: true });
StrokeSchema.index({ roomId: 1, deleted: 1, seq: 1 });

const Stroke = mongoose.model("Stroke", StrokeSchema);

export default Stroke;
