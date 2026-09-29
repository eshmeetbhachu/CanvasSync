// Never throw; return canonical copies so untrusted fields/operators can't reach MongoDB, Redis or clients.

export const MAX_STROKE_POINTS = 10000;
export const MIN_STROKE_WIDTH = 1;
export const MAX_STROKE_WIDTH = 50;

// Matches crypto.randomBytes(6).toString("hex") in room.controller.js.
const ROOM_ID_PATTERN = /^[a-f0-9]{12}$/;

// CSS named colours or #rgb / #rgba / #rrggbb / #rrggbbaa.
const COLOR_PATTERN = /^(?:[a-z]{1,30}|#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8}))$/i;

export const isValidRoomId = (roomId) =>
    typeof roomId === "string" && ROOM_ID_PATTERN.test(roomId);

export const isValidStrokeId = (strokeId) =>
    Number.isSafeInteger(strokeId) && strokeId > 0;

const isPlainObject = (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizePoint = (point) => {
    if (!isPlainObject(point)) return null;

    const { x, y } = point;

    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return { x, y };
};

export const sanitizeStroke = (stroke) => {
    if (!isPlainObject(stroke)) return null;

    const { id, color, strokeWidth, points } = stroke;

    if (!isValidStrokeId(id)) return null;

    if (typeof color !== "string" || !COLOR_PATTERN.test(color)) return null;

    if (
        !Number.isFinite(strokeWidth) ||
        strokeWidth < MIN_STROKE_WIDTH ||
        strokeWidth > MAX_STROKE_WIDTH
    ) {
        return null;
    }

    if (
        !Array.isArray(points) ||
        points.length === 0 ||
        points.length > MAX_STROKE_POINTS
    ) {
        return null;
    }

    const canonicalPoints = [];

    for (const point of points) {
        const canonicalPoint = sanitizePoint(point);

        if (!canonicalPoint) return null;

        canonicalPoints.push(canonicalPoint);
    }

    return {
        id,
        color,
        strokeWidth,
        points: canonicalPoints,
    };
};

// Drops invalid entries so already-persisted bad strokes are never served.
export const sanitizeStrokes = (strokes) => {
    if (!Array.isArray(strokes)) return [];

    const canonicalStrokes = [];

    for (const stroke of strokes) {
        const canonicalStroke = sanitizeStroke(stroke);

        if (canonicalStroke) canonicalStrokes.push(canonicalStroke);
    }

    return canonicalStrokes;
};
