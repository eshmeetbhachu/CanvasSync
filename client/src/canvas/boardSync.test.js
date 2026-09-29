import { test } from "node:test";
import assert from "node:assert/strict";
import { createBoardSync } from "./boardSync.js";

// Minimal stand-in for a socket.io-client socket: records emits and lets the test answer acknowledgements.
const createFakeSocket = () => {
    const handlers = new Map();
    const sent = [];

    return {
        connected: false,
        sent,
        on(event, handler) {
            handlers.set(event, [...(handlers.get(event) ?? []), handler]);
        },
        off(event, handler) {
            handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== handler));
        },
        emit(event, payload, ack) {
            sent.push({ event, payload, ack });
        },
        fire(event, payload) {
            for (const handler of handlers.get(event) ?? []) handler(payload);
        },
        connect() {
            this.connected = true;
            this.fire("connect");
        },
        drop() {
            this.connected = false;
            this.fire("disconnect");
        },
        last(event) {
            return sent.filter((s) => s.event === event).at(-1);
        },
    };
};

const stroke = (id, extra = {}) => ({
    id,
    color: "black",
    strokeWidth: 4,
    points: [{ x: 1, y: 2 }],
    ...extra,
});

const confirmed = (id, seq, rev = seq, extra = {}) => ({ ...stroke(id), seq, rev, deleted: false, ...extra });
const tombstone = (id, seq, rev) => ({ id, seq, rev, deleted: true });
const ids = (sync) => sync.visibleStrokes().map((s) => s.id);

const setup = (strokes = []) => {
    const socket = createFakeSocket();
    const errors = [];
    const sync = createBoardSync({ roomId: "a1b2c3d4e5f6", onJoinError: (m) => errors.push(m) });

    sync.attach(socket);
    socket.connect();
    socket.last("join-room").ack({ ok: true, strokes });

    return { socket, sync, errors };
};

test("joins on connect and shows the snapshot in seq order", () => {
    const { socket, sync } = setup([confirmed("b", 2), confirmed("a", 1), tombstone("c", 3, 4)]);

    assert.deepEqual(socket.sent[0].payload, { roomId: "a1b2c3d4e5f6" });
    assert.deepEqual(ids(sync), ["a", "b"]);
    assert.equal(sync.isJoined(), true);
});

test("reports join failures", () => {
    const socket = createFakeSocket();
    const errors = [];
    const sync = createBoardSync({ roomId: "a1b2c3d4e5f6", onJoinError: (m) => errors.push(m) });

    sync.attach(socket);
    socket.connect();
    socket.last("join-room").ack({ ok: false, message: "Room does not exist" });

    assert.deepEqual(errors, ["Room does not exist"]);
    assert.equal(sync.isJoined(), false);
});

test("a new stroke shows immediately and takes its server seq when acknowledged", () => {
    const { socket, sync } = setup([confirmed("a", 1)]);

    sync.addStroke(stroke("mine"));
    assert.deepEqual(ids(sync), ["a", "mine"]);

    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("mine", 5) });
    assert.deepEqual(sync.visibleStrokes().map((s) => [s.id, s.seq]), [["a", 1], ["mine", 5]]);
});

test("remote strokes are ordered by seq regardless of arrival order", () => {
    const { socket, sync } = setup();

    socket.fire("stroke:changed", confirmed("late", 7));
    socket.fire("stroke:changed", confirmed("early", 3));

    assert.deepEqual(ids(sync), ["early", "late"]);
});

test("older updates never overwrite newer ones", () => {
    const { socket, sync } = setup([confirmed("x", 1)]);

    socket.fire("stroke:changed", tombstone("x", 1, 9));
    socket.fire("stroke:changed", confirmed("x", 1, 5));

    assert.deepEqual(ids(sync), []);
});

test("only one operation is in flight; a delete waits for the add's rev", () => {
    const { socket, sync } = setup();

    sync.addStroke(stroke("s"));
    sync.undo();

    assert.equal(socket.sent.filter((s) => s.event === "stroke:delete").length, 0);
    assert.deepEqual(ids(sync), []);

    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("s", 4) });
    assert.deepEqual(socket.last("stroke:delete").payload, { id: "s", baseRev: 4 });

    socket.last("stroke:delete").ack({ ok: true, stroke: tombstone("s", 4, 5) });
    assert.deepEqual(ids(sync), []);
    assert.equal(sync.pendingCount(), 0);
});

test("undo only reverses this user's own strokes (H5)", () => {
    const { socket, sync } = setup();

    sync.addStroke(stroke("mine"));
    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("mine", 1) });
    socket.fire("stroke:changed", confirmed("theirs", 2));

    sync.undo();

    assert.deepEqual(socket.last("stroke:delete").payload, { id: "mine", baseRev: 1 });
    assert.deepEqual(ids(sync), ["theirs"]);
});

test("undo skips strokes someone else already erased", () => {
    const { socket, sync } = setup();

    sync.addStroke(stroke("first"));
    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("first", 1) });
    sync.addStroke(stroke("second"));
    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("second", 2) });
    socket.fire("stroke:changed", tombstone("second", 2, 3));

    sync.undo();

    assert.deepEqual(socket.last("stroke:delete").payload, { id: "first", baseRev: 1 });
});

test("redo restores by id and undo of an erase restores the stroke", () => {
    const { socket, sync } = setup([confirmed("x", 1)]);

    sync.eraseStroke("x");
    socket.last("stroke:delete").ack({ ok: true, stroke: tombstone("x", 1, 2) });
    assert.deepEqual(ids(sync), []);

    sync.undo();
    assert.deepEqual(ids(sync), ["x"], "restore is shown optimistically using the points kept on delete");
    assert.deepEqual(socket.last("stroke:restore").payload, { id: "x", baseRev: 2 });
    socket.last("stroke:restore").ack({ ok: true, stroke: confirmed("x", 1, 3) });

    sync.redo();
    assert.deepEqual(socket.last("stroke:delete").payload, { id: "x", baseRev: 3 });
});

test("drawing clears the redo stack", () => {
    const { socket, sync } = setup();

    sync.addStroke(stroke("a"));
    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("a", 1) });
    sync.undo();
    socket.last("stroke:delete").ack({ ok: true, stroke: tombstone("a", 1, 2) });
    sync.addStroke(stroke("b"));
    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("b", 3) });
    const sentBefore = socket.sent.length;

    sync.redo();

    assert.equal(socket.sent.length, sentBefore);
});

test("a rejected change is rolled back", () => {
    const { socket, sync } = setup([confirmed("x", 1)]);

    sync.addStroke(stroke("bad"));
    socket.last("stroke:add").ack({ ok: false, message: "Invalid stroke" });

    assert.deepEqual(ids(sync), ["x"]);
    assert.equal(sync.pendingCount(), 0);
});

test("nothing is sent while disconnected; unacknowledged changes are resent after rejoin (M3/M5)", () => {
    const { socket, sync } = setup();

    sync.addStroke(stroke("s"));
    const firstAdd = socket.last("stroke:add");
    socket.drop();
    sync.addStroke(stroke("offline"));

    firstAdd.ack({ ok: true, stroke: confirmed("s", 1) });
    assert.equal(sync.pendingCount(), 2, "acks from the old connection are ignored");
    assert.equal(socket.sent.filter((s) => s.event === "stroke:add").length, 1);

    socket.connect();
    assert.equal(socket.sent.filter((s) => s.event === "stroke:add").length, 1, "waits for the join ack");
    socket.last("join-room").ack({ ok: true, strokes: [confirmed("s", 1)] });

    assert.deepEqual(socket.last("stroke:add").payload.stroke.id, "s", "resends with the same id");
    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("s", 1) });
    assert.deepEqual(socket.last("stroke:add").payload.stroke.id, "offline");
    socket.last("stroke:add").ack({ ok: true, stroke: confirmed("offline", 2) });

    assert.deepEqual(ids(sync), ["s", "offline"]);
});

test("a resent delete keeps its original baseRev so it cannot override a newer change", () => {
    const { socket, sync } = setup([confirmed("x", 1)]);

    sync.eraseStroke("x");
    assert.equal(socket.last("stroke:delete").payload.baseRev, 1);
    socket.drop();
    socket.connect();
    socket.last("join-room").ack({ ok: true, strokes: [confirmed("x", 1, 7)] });

    assert.deepEqual(socket.last("stroke:delete").payload, { id: "x", baseRev: 1 });
});

test("changes broadcast before the join snapshot arrives are not lost", () => {
    const socket = createFakeSocket();
    const sync = createBoardSync({ roomId: "a1b2c3d4e5f6" });

    sync.attach(socket);
    socket.connect();
    socket.fire("stroke:changed", confirmed("during-join", 5));
    socket.last("join-room").ack({ ok: true, strokes: [confirmed("a", 1)] });

    assert.deepEqual(ids(sync), ["a", "during-join"]);
});

test("detach stops listening to the old socket", () => {
    const { socket, sync } = setup();

    sync.detach();
    socket.fire("stroke:changed", confirmed("ignored", 1));

    assert.deepEqual(ids(sync), []);
    assert.equal(sync.isJoined(), false);
});
