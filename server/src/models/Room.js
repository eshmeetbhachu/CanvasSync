import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    name: {
        type: String,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    // Last sequence number handed out for this room's stroke changes.
    seq: {
        type: Number,
        default: 0,
    },
});

const Room = mongoose.model("Room", roomSchema);

export default Room;