import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoomInput } from "./roomLink.js";
import { timeAgo } from "./time.js";

test("parseRoomInput accepts a bare id or an invite link", () => {
    assert.equal(parseRoomInput("  a1b2c3d4e5f6 "), "a1b2c3d4e5f6");
    assert.equal(parseRoomInput("https://canvassync.app/board/a1b2c3d4e5f6"), "a1b2c3d4e5f6");
    assert.equal(parseRoomInput("http://localhost:5173/board/a1b2c3d4e5f6?x=1"), "a1b2c3d4e5f6");
    assert.equal(parseRoomInput("canvassync.app/board/a1b2c3d4e5f6/"), "a1b2c3d4e5f6");
});

test("parseRoomInput rejects anything else", () => {
    for (const value of ["", "hello", "A1B2C3D4E5F6", "a1b2c3d4e5f", "a1b2c3d4e5f6a", "https://x/board/a1b2c3d4e5f6a", "https://x/rooms"]) {
        assert.equal(parseRoomInput(value), null, value);
    }
});

test("timeAgo describes recent and older times", () => {
    const now = Date.parse("2026-01-10T12:00:00Z");

    assert.equal(timeAgo("2026-01-10T11:59:40Z", now), "just now");
    assert.equal(timeAgo("2026-01-10T11:55:00Z", now), "5 minutes ago");
    assert.equal(timeAgo("2026-01-10T09:00:00Z", now), "3 hours ago");
    assert.equal(timeAgo("2026-01-09T12:00:00Z", now), "yesterday");
    assert.equal(timeAgo("2025-12-20T12:00:00Z", now), "3 weeks ago");
});
