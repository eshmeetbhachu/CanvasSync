import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_ROOM_NAME_LENGTH, sanitizeRoomName } from "./room.validator.js";

test("sanitizeRoomName trims and accepts normal names", () => {
    assert.equal(sanitizeRoomName("  Sprint planning  "), "Sprint planning");
    assert.equal(sanitizeRoomName("a".repeat(MAX_ROOM_NAME_LENGTH)), "a".repeat(MAX_ROOM_NAME_LENGTH));
});

test("sanitizeRoomName rejects empty, overlong and non-string names", () => {
    for (const value of ["", "   ", "a".repeat(MAX_ROOM_NAME_LENGTH + 1), undefined, null, 5, { $ne: "" }, ["x"]]) {
        assert.equal(sanitizeRoomName(value), null, JSON.stringify(value));
    }
});
