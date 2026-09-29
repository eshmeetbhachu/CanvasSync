import { useEffect, useImperativeHandle, useRef, useState } from "react";
import RemoteCursor from "./RemoteCursor";

// Cursor updates are collected and applied once per animation frame, so only this layer re-renders.
function RemoteCursors({ ref }) {
    const [cursors, setCursors] = useState({});
    const pending = useRef(new Map());
    const frame = useRef(0);

    useImperativeHandle(ref, () => {
        const flush = () => {
            frame.current = 0;
            const updates = pending.current;
            pending.current = new Map();

            setCursors((previous) => {
                const next = { ...previous };

                for (const [id, cursor] of updates) {
                    if (cursor) next[id] = cursor;
                    else delete next[id];
                }

                return next;
            });
        };

        const schedule = () => {
            if (!frame.current) frame.current = requestAnimationFrame(flush);
        };

        return {
            move(cursor) {
                pending.current.set(cursor.id, cursor);
                schedule();
            },
            remove(id) {
                pending.current.set(id, null);
                schedule();
            },
            clear() {
                pending.current = new Map();
                setCursors({});
            },
        };
    }, []);

    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    return Object.values(cursors).map((cursor) => (
        <RemoteCursor
            key={cursor.id}
            cursor={cursor}
        />
    ));
}

export default RemoteCursors;
