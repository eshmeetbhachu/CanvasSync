import Board from "../models/Board.js";
import Room from "../models/Room.js";
import Stroke from "../models/Stroke.js";
import { sanitizeStroke } from "../validators/board.validator.js";

// Legacy strokes used Date.now() numbers as ids; malformed or duplicated entries are dropped.
export const toStrokesFromLegacy = (legacyStrokes) => {
    const strokes = [];
    const seen = new Set();

    for (const legacy of Array.isArray(legacyStrokes) ? legacyStrokes : []) {
        const id = Number.isSafeInteger(legacy?.id) ? String(legacy.id) : legacy?.id;
        const stroke = sanitizeStroke({ ...legacy, id });

        if (!stroke || seen.has(stroke.id)) continue;

        seen.add(stroke.id);
        strokes.push(stroke);
    }

    return strokes;
};

// Deterministic (seq = array position) and upsert-only, so re-runs and concurrent instances are safe.
export const migrateLegacyBoards = async () => {
    await Stroke.init();

    let migratedBoards = 0;
    let migratedStrokes = 0;

    for await (const board of Board.find({ migratedAt: { $exists: false } }).lean().cursor()) {
        const roomExists = await Room.exists({ roomId: board.roomId });

        if (roomExists) {
            const strokes = toStrokesFromLegacy(board.strokes);

            if (strokes.length > 0) {
                await Stroke.bulkWrite(
                    strokes.map((stroke, index) => ({
                        updateOne: {
                            filter: { roomId: board.roomId, strokeId: stroke.id },
                            update: {
                                $setOnInsert: {
                                    roomId: board.roomId,
                                    strokeId: stroke.id,
                                    color: stroke.color,
                                    strokeWidth: stroke.strokeWidth,
                                    points: stroke.points,
                                    seq: index + 1,
                                    rev: index + 1,
                                    deleted: false,
                                },
                            },
                            upsert: true,
                        },
                    })),
                    { ordered: false }
                );
            }

            await Room.updateOne({ roomId: board.roomId }, { $max: { seq: strokes.length } });
            migratedStrokes += strokes.length;
        }

        await Board.updateOne({ _id: board._id }, { $set: { migratedAt: new Date() } });
        migratedBoards += 1;
    }

    if (migratedBoards > 0) {
        console.log(`Migrated ${migratedStrokes} strokes from ${migratedBoards} legacy boards`);
    }
};
