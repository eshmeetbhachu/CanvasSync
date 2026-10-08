import { DRAWING_LABELS } from "../constants/shapes.js";
import { sanitizePoint } from "./board.validator.js";

// A single click is not a shape; the upper bound keeps one request well under the JSON body limit.
export const MIN_DRAWING_POINTS = 2;
export const MAX_DRAWING_POINTS = 2000;

const SESSION_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

// Returns a canonical { label, points, sessionId } or null; never throws on untrusted input.
export const sanitizeLabeledDrawing = (body) => {
    if (typeof body !== "object" || body === null || Array.isArray(body)) return null;

    const { label, points, sessionId } = body;

    if (!DRAWING_LABELS.includes(label)) return null;

    if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId)) return null;

    if (
        !Array.isArray(points) ||
        points.length < MIN_DRAWING_POINTS ||
        points.length > MAX_DRAWING_POINTS
    ) {
        return null;
    }

    const canonicalPoints = [];

    for (const point of points) {
        const canonicalPoint = sanitizePoint(point);

        if (!canonicalPoint) return null;

        canonicalPoints.push(canonicalPoint);
    }

    return { label, points: canonicalPoints, sessionId };
};
