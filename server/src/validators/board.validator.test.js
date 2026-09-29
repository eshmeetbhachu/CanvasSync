import { test } from "node:test";
import assert from "node:assert/strict";
import Board from "../models/Board.js";
import {
    MAX_STROKE_POINTS,
    isValidRoomId,
    isValidStrokeId,
    sanitizeCursor,
    sanitizeStroke,
    sanitizeStrokes,
} from "./board.validator.js";

const validStroke = () => ({
    id: 1760000000000,
    color: "black",
    strokeWidth: 4,
    points: [{ x: 10.5, y: 20 }, { x: 11, y: 21.25 }],
});

test("isValidRoomId accepts generated room ids", () => {
    assert.equal(isValidRoomId("a1b2c3d4e5f6"), true);
});

test("isValidRoomId rejects operators and malformed ids", () => {
    for (const value of [
        { $regex: "^a" },
        { $ne: null },
        ["a1b2c3d4e5f6"],
        "A1B2C3D4E5F6",
        "a1b2c3d4e5f",
        "a1b2c3d4e5f60",
        "[object Object]",
        "a1b2c3d4e5f6\n",
        123456789012,
        null,
        undefined,
    ]) {
        assert.equal(isValidRoomId(value), false, JSON.stringify(value));
    }
});

test("isValidStrokeId accepts Date.now() ids", () => {
    assert.equal(isValidStrokeId(Date.now()), true);
});

test("isValidStrokeId rejects operators and non-integers", () => {
    for (const value of [
        { $gt: 0 },
        { $exists: true },
        "abc",
        "1760000000000",
        0,
        -1,
        1.5,
        NaN,
        Infinity,
        2 ** 53,
        null,
        undefined,
    ]) {
        assert.equal(isValidStrokeId(value), false, String(value));
    }
});

test("sanitizeStroke returns a canonical copy of a client stroke", () => {
    const stroke = validStroke();
    const result = sanitizeStroke(stroke);

    assert.deepEqual(result, stroke);
    assert.notEqual(result, stroke);
    assert.notEqual(result.points[0], stroke.points[0]);
});

test("sanitizeStroke accepts single-point strokes, palette widths and hex colours", () => {
    for (const color of ["red", "purple", "#fff", "#ff000080", "#A1B2C3"]) {
        for (const strokeWidth of [4, 6, 10, 15]) {
            const stroke = { ...validStroke(), color, strokeWidth, points: [{ x: 0, y: 0 }] };
            assert.deepEqual(sanitizeStroke(stroke), stroke);
        }
    }
});

test("sanitizeStroke strips extra fields such as MongoDB _id", () => {
    const stroke = {
        ...validStroke(),
        _id: "6abaabad62e8bc7e8e52c011",
        evil: { $where: "1" },
        points: [{ x: 1, y: 2, _id: "6abaabad62e8bc7e8e52c012", z: 3 }],
    };

    assert.deepEqual(sanitizeStroke(stroke), {
        id: stroke.id,
        color: "black",
        strokeWidth: 4,
        points: [{ x: 1, y: 2 }],
    });
});

test("sanitizeStroke accepts strokes hydrated from the Board model", () => {
    const board = Board.hydrate({
        roomId: "a1b2c3d4e5f6",
        strokes: [validStroke()],
    });

    assert.deepEqual(sanitizeStroke(board.strokes[0]), validStroke());
});

test("sanitizeStroke rejects malformed strokes", () => {
    const tooManyPoints = Array.from({ length: MAX_STROKE_POINTS + 1 }, () => ({ x: 1, y: 1 }));

    for (const [label, value] of [
        ["null", null],
        ["array", [validStroke()]],
        ["string", "stroke"],
        ["id only", { id: 1 }],
        ["missing points", { ...validStroke(), points: undefined }],
        ["empty points", { ...validStroke(), points: [] }],
        ["points object", { ...validStroke(), points: { 0: { x: 1, y: 1 } } }],
        ["too many points", { ...validStroke(), points: tooManyPoints }],
        ["null point", { ...validStroke(), points: [null] }],
        ["string coordinate", { ...validStroke(), points: [{ x: "1", y: 1 }] }],
        ["missing coordinate", { ...validStroke(), points: [{ x: 1 }] }],
        ["operator id", { ...validStroke(), id: { $gt: 0 } }],
        ["string id", { ...validStroke(), id: "abc" }],
        ["operator colour", { ...validStroke(), color: { $gt: "" } }],
        ["css injection colour", { ...validStroke(), color: "red; background: url(x)" }],
        ["overlong colour", { ...validStroke(), color: "a".repeat(31) }],
        ["zero width", { ...validStroke(), strokeWidth: 0 }],
        ["huge width", { ...validStroke(), strokeWidth: 51 }],
        ["string width", { ...validStroke(), strokeWidth: "4" }],
    ]) {
        assert.equal(sanitizeStroke(value), null, label);
    }
});

test("sanitizeStrokes keeps valid strokes and drops invalid ones", () => {
    const stroke = validStroke();

    assert.deepEqual(sanitizeStrokes([stroke, null, { id: 1 }, stroke]), [stroke, stroke]);
    assert.deepEqual(sanitizeStrokes(null), []);
    assert.deepEqual(sanitizeStrokes({ 0: stroke }), []);
});

const alice = { id: "aliceSocketId", name: "alice" };

test("sanitizeCursor relays a valid position with the authenticated identity", () => {
    assert.deepEqual(
        sanitizeCursor({ id: "aliceSocketId", name: "alice", x: 12.5, y: 40 }, alice),
        { id: "aliceSocketId", name: "alice", x: 12.5, y: 40 }
    );
});

test("sanitizeCursor ignores a spoofed id", () => {
    const result = sanitizeCursor({ id: "bobSocketId", name: "alice", x: 1, y: 2 }, alice);

    assert.equal(result.id, "aliceSocketId");
});

test("sanitizeCursor ignores a spoofed name", () => {
    const result = sanitizeCursor({ id: "aliceSocketId", name: "bob", x: 1, y: 2 }, alice);

    assert.equal(result.name, "alice");
});

test("sanitizeCursor drops extra and non-string identity fields", () => {
    const result = sanitizeCursor(
        { id: { $gt: "" }, name: { toString: "x" }, x: 1, y: 2, evil: "<img>" },
        alice
    );

    assert.deepEqual(result, { id: "aliceSocketId", name: "alice", x: 1, y: 2 });
});

test("sanitizeCursor rejects malformed positions", () => {
    for (const [label, value] of [
        ["undefined", undefined],
        ["null", null],
        ["string", "cursor"],
        ["array", [1, 2]],
        ["missing y", { x: 1 }],
        ["string x", { x: "1", y: 2 }],
        ["object x", { x: { $gt: 0 }, y: 2 }],
        ["nested", { x: [[[1]]], y: 2 }],
        ["null x", { x: null, y: 2 }],
    ]) {
        assert.equal(sanitizeCursor(value, alice), null, label);
    }
});
