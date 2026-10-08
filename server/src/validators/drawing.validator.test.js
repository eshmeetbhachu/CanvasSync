import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_DRAWING_POINTS, sanitizeLabeledDrawing } from "./drawing.validator.js";

const valid = (extra = {}) => ({
    label: "circle",
    sessionId: "3b241101-e2bb-4255-8caf-4136c566a962",
    points: [{ x: 1, y: 2 }, { x: 3.5, y: 4 }, { x: 5, y: 6 }],
    ...extra,
});

test("accepts every label and returns only the known fields", () => {
    for (const label of ["circle", "rectangle", "diamond", "triangle", "line", "arrow", "other"]) {
        const body = valid({ label, userId: "someone-else", extra: 1, points: [{ x: 1, y: 2, t: 9 }, { x: 3, y: 4 }] });

        assert.deepEqual(sanitizeLabeledDrawing(body), {
            label,
            sessionId: body.sessionId,
            points: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
        });
    }
});

test("rejects malformed drawings", () => {
    const tooMany = Array.from({ length: MAX_DRAWING_POINTS + 1 }, () => ({ x: 1, y: 1 }));

    for (const [name, body] of [
        ["undefined body", undefined],
        ["null body", null],
        ["array body", []],
        ["unknown label", valid({ label: "hexagon" })],
        ["operator label", valid({ label: { $ne: null } })],
        ["missing session", valid({ sessionId: undefined })],
        ["operator session", valid({ sessionId: { $gt: "" } })],
        ["session with bad characters", valid({ sessionId: "a b$" })],
        ["single point", valid({ points: [{ x: 1, y: 1 }] })],
        ["too many points", valid({ points: tooMany })],
        ["points not an array", valid({ points: "points" })],
        ["null point", valid({ points: [{ x: 1, y: 1 }, null] })],
        ["string coordinate", valid({ points: [{ x: "1", y: 1 }, { x: 2, y: 2 }] })],
    ]) {
        assert.equal(sanitizeLabeledDrawing(body), null, name);
    }
});
