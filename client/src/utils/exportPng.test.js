import { test } from "node:test";
import assert from "node:assert/strict";
import { safeFileName, strokesBounds } from "./exportPng.js";

test("strokesBounds covers every point plus half the line width", () => {
    const bounds = strokesBounds([
        { strokeWidth: 4, points: [{ x: 10, y: 20 }, { x: 50, y: 30 }] },
        { strokeWidth: 10, points: [{ x: 100, y: 5 }] },
    ]);

    assert.deepEqual(bounds, { x: 8, y: 0, width: 97, height: 32 });
    assert.equal(strokesBounds([]), null);
});

test("safeFileName keeps letters, digits, spaces as dashes", () => {
    assert.equal(safeFileName("Sprint planning: Q3/Q4"), "Sprint-planning-Q3Q4");
    assert.equal(safeFileName("???"), "board");
    assert.equal(safeFileName(undefined), "board");
});
