import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";
import { LuCopy, LuShare2 } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import Canvas from "../canvas/Canvas";
import AvatarStack from "../components/AvatarStack";
import AccountMenu from "../components/layout/AccountMenu";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { inviteLink } from "../utils/roomLink";

const API = `${import.meta.env.VITE_API_URL}/api/rooms`;
const MAX_NAME_LENGTH = 60;

const STATUS = {
    connecting: { label: "Connecting…", dot: "bg-bone animate-pulse" },
    live: { label: "Live", dot: "bg-[#4F6D5A]" },
    saving: { label: "Saving…", dot: "bg-[#A07A2C] animate-pulse" },
    reconnecting: { label: "Reconnecting…", dot: "bg-danger animate-pulse" },
};

// The owner can click the name to rename the board; everyone else just sees it.
function BoardName({ room, onRename }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (editing) inputRef.current?.select();
    }, [editing]);

    if (!room) return <span className="h-7 w-40 animate-pulse rounded-lg bg-sand" aria-hidden="true" />;

    if (!room.isOwner) return <h1 className="truncate font-display text-3xl">{room.name}</h1>;

    if (!editing) {
        return (
            <h1 className="truncate font-display text-3xl">
                <button
                    onClick={() => {
                        setDraft(room.name);
                        setEditing(true);
                    }}
                    title="Rename board"
                    className="block max-w-full truncate rounded-lg px-1 -mx-1 text-left cursor-text hover:bg-sand"
                >
                    {room.name}
                </button>
            </h1>
        );
    }

    const finish = async (save) => {
        setEditing(false);

        const name = draft.trim();

        if (save && name && name !== room.name) await onRename(name);
    };

    return (
        <input
            ref={inputRef}
            aria-label="Board name"
            value={draft}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => finish(true)}
            onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") finish(false);
            }}
            className="w-full max-w-sm rounded-lg border border-ink bg-paper px-1 font-display text-3xl focus:outline-none"
        />
    );
}

function Board() {
    const { roomId } = useParams();
    const { user, authenticatedFetch } = useAuth();

    const [roomError, setRoomError] = useState("");
    const [room, setRoom] = useState(null);
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState("connecting");
    const [shareOpen, setShareOpen] = useState(false);

    const closeShare = useCallback(() => setShareOpen(false), []);

    // authenticatedFetch changes identity on every token refresh; the board should only reload when roomId does.
    const fetchRef = useRef(authenticatedFetch);
    fetchRef.current = authenticatedFetch;

    useEffect(() => {
        let cancelled = false;

        setRoom(null);
        setRoomError("");
        setUsers([]);
        setStatus("connecting");

        // A missing board is reported by the socket join, which shows the error screen.
        fetchRef.current(`${API}/${roomId}`)
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (!cancelled && data) setRoom(data.room);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [roomId]);

    useEffect(() => {
        if (room) document.title = `${room.name} · CanvasSync`;

        return () => {
            document.title = "CanvasSync: sketch together, in real time";
        };
    }, [room]);

    const renameBoard = async (name) => {
        try {
            const response = await authenticatedFetch(`${API}/${roomId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) throw new Error();

            setRoom((await response.json()).room);
            toast.success("Board renamed");
        } catch {
            toast.error("Could not rename the board");
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink(roomId));
            toast.success("Invite link copied");
        } catch {
            toast.error("Could not copy. Copy the address bar instead.");
        }
    };

    if (roomError) {
        return (
            <div className="dot-grid flex min-h-screen items-center justify-center bg-paper px-4">
                <div className="w-full max-w-md rounded-3xl border border-bone bg-paper p-8 text-center shadow-sm">
                    <h1 className="font-display text-4xl">Unable to open this board</h1>
                    <p className="mt-3 text-olive">{roomError}</p>
                    <Button to="/dashboard" className="mt-8 w-full">Back to your boards</Button>
                </div>
            </div>
        );
    }

    const current = STATUS[status];

    return (
        <div className="min-h-screen bg-paper">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-sand px-4 py-3 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Link
                        to="/dashboard"
                        aria-label="Your boards"
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-bone text-olive hover:border-olive hover:text-ink"
                    >
                        <FiArrowLeft aria-hidden="true" />
                    </Link>

                    <div className="min-w-0 flex-1">
                        <BoardName room={room} onRename={renameBoard} />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span role="status" className="hidden items-center gap-2 rounded-full border border-bone px-3 py-1.5 text-xs font-medium text-olive sm:inline-flex">
                        <span className={`size-2 rounded-full ${current.dot}`} aria-hidden="true" />
                        {current.label}
                    </span>

                    <AvatarStack users={users} currentUserId={user?.id} />

                    <Button size="sm" onClick={() => setShareOpen(true)}>
                        <LuShare2 aria-hidden="true" />
                        Share
                    </Button>

                    <AccountMenu showDashboardLink />
                </div>
            </header>

            <Canvas
                roomId={roomId}
                boardName={room?.name}
                onRoomError={setRoomError}
                onUsersChange={setUsers}
                onStatusChange={setStatus}
            />

            <Modal
                open={shareOpen}
                title="Share this board"
                description="Anyone with a CanvasSync account and this link can open the board and draw on it."
                onClose={closeShare}
            >
                <div className="flex gap-2">
                    <input
                        readOnly
                        aria-label="Invite link"
                        value={inviteLink(roomId)}
                        onFocus={(event) => event.target.select()}
                        className="h-11 min-w-0 flex-1 rounded-xl border border-bone bg-sand/40 px-4 text-sm text-ink focus:outline-none focus:border-ink"
                    />
                    <Button onClick={copyLink}>
                        <LuCopy aria-hidden="true" />
                        Copy
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

export default Board;
