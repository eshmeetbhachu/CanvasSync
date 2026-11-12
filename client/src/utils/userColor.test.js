import { test } from "node:test";
import assert from "node:assert/strict";
import { USER_COLORS, colorForUser } from "./userColor.js";

test("colorForUser is stable and always from the palette", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `6a1f${i.toString(16).padStart(20, "0")}`);

    for (const id of ids) {
        assert.equal(colorForUser(id), colorForUser(id));
        assert.ok(USER_COLORS.includes(colorForUser(id)));
    }

    assert.ok(new Set(ids.map(colorForUser)).size >= 5, "ids should spread across colours");
    assert.ok(USER_COLORS.includes(colorForUser(undefined)));
});
