// Server-authoritative board state: what the user sees is `confirmed` (highest rev wins) with the unacknowledged `outbox` applied on top.

const EVENTS = {
    add: "stroke:add",
    delete: "stroke:delete",
    restore: "stroke:restore",
};

const bySeq = (a, b) => (a.seq ?? Infinity) - (b.seq ?? Infinity);

export const createBoardSync = ({ roomId, onChange, onJoinError }) => {
    let socket = null;
    let joined = false;
    let inFlight = false;
    // Bumped on every (re)connect so acknowledgements from an older connection are ignored.
    let generation = 0;
    let bufferedChanges = [];
    let confirmed = new Map();
    const outbox = [];
    const history = [];
    let redoStack = [];

    const notify = () => onChange?.();

    const applyConfirmed = (stroke) => {
        const current = confirmed.get(stroke.id);

        if (current && current.rev > stroke.rev) return;

        // Deleted strokes arrive without points; keep any we already have so a later restore can show instantly.
        confirmed.set(stroke.id, stroke.deleted ? { ...current, ...stroke } : stroke);
    };

    const currentState = () => {
        const state = new Map(confirmed);

        for (const op of outbox) {
            if (op.type === "add") {
                if (!state.has(op.stroke.id)) state.set(op.stroke.id, { ...op.stroke, deleted: false });
                continue;
            }

            const stroke = state.get(op.id);

            if (stroke) state.set(op.id, { ...stroke, deleted: op.type === "delete" });
        }

        return state;
    };

    const visibleStrokes = () =>
        [...currentState().values()]
            .filter((stroke) => !stroke.deleted && stroke.points)
            .sort(bySeq);

    // One operation in flight at a time keeps this user's changes in order on the server.
    const pump = () => {
        if (!socket?.connected || !joined || inFlight || outbox.length === 0) return;

        const op = outbox[0];

        // Fixed on first send and kept for resends, so a resend after a lost ack cannot apply twice.
        if (op.type !== "add" && op.baseRev === undefined) {
            op.baseRev = confirmed.get(op.id)?.rev;

            if (op.baseRev === undefined) {
                outbox.shift();
                notify();
                pump();
                return;
            }
        }

        inFlight = true;
        const sentGeneration = generation;
        const payload = op.type === "add" ? { stroke: op.stroke } : { id: op.id, baseRev: op.baseRev };

        socket.emit(EVENTS[op.type], payload, (result) => {
            if (sentGeneration !== generation) return;

            inFlight = false;
            outbox.shift();

            if (result?.ok && result.stroke) {
                applyConfirmed(result.stroke);
            } else if (!result?.ok) {
                console.warn(`Board change "${op.type}" was rejected:`, result?.message);
            }

            notify();
            pump();
        });
    };

    const join = () => {
        joined = false;
        inFlight = false;
        generation += 1;
        bufferedChanges = [];
        const joinGeneration = generation;

        socket.emit("join-room", { roomId }, (result) => {
            if (joinGeneration !== generation) return;

            if (!result?.ok) {
                onJoinError?.(result?.message ?? "Failed to join room");
                return;
            }

            confirmed = new Map();

            for (const stroke of result.strokes) applyConfirmed(stroke);

            // Changes broadcast between the server-side join and our snapshot; rev ordering makes replay safe.
            for (const stroke of bufferedChanges) applyConfirmed(stroke);

            bufferedChanges = [];
            joined = true;
            notify();
            pump();
        });
    };

    const handleDisconnect = () => {
        joined = false;
        inFlight = false;
        generation += 1;
    };

    const handleChange = (stroke) => {
        if (!joined) {
            bufferedChanges.push(stroke);
            return;
        }

        applyConfirmed(stroke);
        notify();
    };

    const detach = () => {
        if (!socket) return;

        socket.off("connect", join);
        socket.off("disconnect", handleDisconnect);
        socket.off("stroke:changed", handleChange);
        socket = null;
        handleDisconnect();
    };

    const attach = (nextSocket) => {
        detach();
        socket = nextSocket;
        socket.on("connect", join);
        socket.on("disconnect", handleDisconnect);
        socket.on("stroke:changed", handleChange);

        if (socket.connected) join();
    };

    const queue = (op) => {
        outbox.push(op);
        notify();
        pump();
    };

    const addStroke = (stroke) => {
        history.push({ type: "add", id: stroke.id });
        redoStack = [];
        queue({ type: "add", stroke });
    };

    const eraseStroke = (id) => {
        const stroke = currentState().get(id);

        if (!stroke || stroke.deleted) return;

        history.push({ type: "erase", id });
        redoStack = [];
        queue({ type: "delete", id });
    };

    // Undo only reverses this user's own actions; entries whose stroke someone else changed are skipped.
    const undo = () => {
        const state = currentState();

        while (history.length > 0) {
            const entry = history.pop();
            const stroke = state.get(entry.id);

            if (entry.type === "add" && stroke && !stroke.deleted) {
                redoStack.push(entry);
                queue({ type: "delete", id: entry.id });
                return;
            }

            if (entry.type === "erase" && stroke?.deleted) {
                redoStack.push(entry);
                queue({ type: "restore", id: entry.id });
                return;
            }
        }
    };

    const redo = () => {
        const state = currentState();

        while (redoStack.length > 0) {
            const entry = redoStack.pop();
            const stroke = state.get(entry.id);

            if (entry.type === "add" && stroke?.deleted) {
                history.push(entry);
                queue({ type: "restore", id: entry.id });
                return;
            }

            if (entry.type === "erase" && stroke && !stroke.deleted) {
                history.push(entry);
                queue({ type: "delete", id: entry.id });
                return;
            }
        }
    };

    return {
        attach,
        detach,
        destroy: detach,
        visibleStrokes,
        addStroke,
        eraseStroke,
        undo,
        redo,
        isJoined: () => joined,
        pendingCount: () => outbox.length,
    };
};
