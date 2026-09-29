import Room from "../models/Room.js";
import Stroke from "../models/Stroke.js";

const DUPLICATE_KEY = 11000;

// Deleted strokes are sent without their points; clients only need them to reject stale updates.
const toClientStroke = (doc) => {
    if (doc.deleted) {
        return {
            id: doc.strokeId,
            seq: doc.seq,
            rev: doc.rev,
            deleted: true,
        };
    }

    return {
        id: doc.strokeId,
        color: doc.color,
        strokeWidth: doc.strokeWidth,
        points: doc.points.map(({ x, y }) => ({ x, y })),
        seq: doc.seq,
        rev: doc.rev,
        deleted: false,
    };
};

// Gaps are harmless: seq only orders strokes and versions changes, it never counts them.
const nextSeq = async (roomId) => {
    const room = await Room.findOneAndUpdate(
        { roomId },
        { $inc: { seq: 1 } },
        { returnDocument: "after", projection: { seq: 1 } }
    ).lean();

    if (!room) {
        throw new Error(`Room ${roomId} not found while allocating seq`);
    }

    return room.seq;
};

const loadBoard = async (roomId) => {
    const [visible, deleted] = await Promise.all([
        Stroke.find({ roomId, deleted: false }).sort({ seq: 1 }).lean(),
        Stroke.find({ roomId, deleted: true }, { strokeId: 1, seq: 1, rev: 1, deleted: 1 }).lean(),
    ]);

    return [...visible, ...deleted].map(toClientStroke);
};

// Idempotent: resending the same stroke id returns the stored stroke instead of inserting it twice.
const addStroke = async (roomId, stroke) => {
    const seq = await nextSeq(roomId);

    try {
        const doc = await Stroke.create({
            roomId,
            strokeId: stroke.id,
            color: stroke.color,
            strokeWidth: stroke.strokeWidth,
            points: stroke.points,
            seq,
            rev: seq,
            deleted: false,
        });

        return { stroke: toClientStroke(doc), created: true };
    } catch (error) {
        if (error.code !== DUPLICATE_KEY) throw error;

        const existing = await Stroke.findOne({ roomId, strokeId: stroke.id }).lean();

        return { stroke: toClientStroke(existing), created: false };
    }
};

// Applies only if the stroke is still at baseRev, so a resent or stale change cannot overwrite a newer one.
const setStrokeDeleted = async (roomId, strokeId, baseRev, deleted) => {
    const rev = await nextSeq(roomId);

    const updated = await Stroke.findOneAndUpdate(
        { roomId, strokeId, rev: baseRev },
        { $set: { deleted, rev } },
        { returnDocument: "after" }
    ).lean();

    if (updated) {
        return { stroke: toClientStroke(updated), applied: true };
    }

    const current = await Stroke.findOne({ roomId, strokeId }).lean();

    return { stroke: current ? toClientStroke(current) : null, applied: false };
};

export { loadBoard, addStroke, setStrokeDeleted };
