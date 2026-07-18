import mongoose from "mongoose";

const PointSchema = new mongoose.Schema({
    x: {
        type: Number,
        required: true,
    },
    y: {
        type: Number,
        required: true,
    },
});

const StrokeSchema = new mongoose.Schema({
    id: {
        type: Number,
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
    points: [PointSchema],
});

const BoardSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    strokes: [StrokeSchema],
});

const Board = mongoose.model("Board", BoardSchema);

export default Board;