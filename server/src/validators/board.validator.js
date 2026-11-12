// Never throw; return canonical copies so untrusted fields/operators can't reach MongoDB, Redis or clients.

import { SHAPE_TYPES } from "../constants/shapes.js";

export const MAX_STROKE_POINTS = 10000;
export const MIN_STROKE_WIDTH = 1;
export const MAX_STROKE_WIDTH = 50;

// Matches crypto.randomBytes(6).toString("hex") in room.controller.js.
const ROOM_ID_PATTERN = /^[a-f0-9]{12}$/;

// CSS named colours or #rgb / #rgba / #rrggbb / #rrggbbaa.
const COLOR_PATTERN = /^(?:[a-z]{1,30}|#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8}))$/i;

export const isValidRoomId = (roomId) =>
    typeof roomId === "string" && ROOM_ID_PATTERN.test(roomId);

// crypto.randomUUID() from clients, or digit strings for strokes migrated from the legacy Board.
const STROKE_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

export const isValidStrokeId = (strokeId) =>
    typeof strokeId === "string" && STROKE_ID_PATTERN.test(strokeId);

export const isValidRev = (rev) =>
    Number.isSafeInteger(rev) && rev > 0;

const isPlainObject = (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value);

export const sanitizePoint = (point) => {
    if (!isPlainObject(point)) return null;

    const { x, y } = point;

    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return { x, y };
};

const sanitizeBbox = (bbox) => {
    if (!isPlainObject(bbox)) return null;

    const { x, y, width, height } = bbox;

    if (![x, y, width, height].every(Number.isFinite)) return null;

    if (width < 0 || height < 0) return null;

    return { x, y, width, height };
};

export const sanitizeStroke = (stroke) => {
    if (!isPlainObject(stroke)) return null;

    const { id, color, strokeWidth, points, shapeType, bbox } = stroke;

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

    const canonical = {
        id,
        color,
        strokeWidth,
        points: canonicalPoints,
    };

    // Shape metadata is all-or-nothing: a stroke is either freehand or a fully described shape.
    if (shapeType === undefined && bbox === undefined) return canonical;

    const canonicalBbox = sanitizeBbox(bbox);

    if (!SHAPE_TYPES.includes(shapeType) || !canonicalBbox) return null;

    return { ...canonical, shapeType, bbox: canonicalBbox };
};

// Only the position comes from the client; identity must come from the authenticated socket.
export const sanitizeCursor = (cursor, identity) => {
    const position = sanitizePoint(cursor);

    if (!position) return null;

    return {
        id: identity.id,
        userId: identity.userId,
        name: identity.name,
        x: position.x,
        y: position.y,
    };
};
