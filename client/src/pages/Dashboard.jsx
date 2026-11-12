import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEdit2, FiLink, FiMoreHorizontal, FiPlus, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import AppHeader from "../components/layout/AppHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Menu from "../components/ui/Menu";
import Modal from "../components/ui/Modal";
import { inviteLink, parseRoomInput } from "../utils/roomLink";
import { timeAgo } from "../utils/time";

const API = `${import.meta.env.VITE_API_URL}/api/rooms`;
const MAX_NAME_LENGTH = 60;

const readError = async (response, fallback) => {
    const data = await response.json().catch(() => null);
    return data?.message ?? fallback;
};

function BoardCard({ room, onOpen, onRename, onCopy, onDelete }) {
    return (
        <article className="group relative rounded-3xl border border-bone bg-paper transition-colors hover:border-olive">
            <button onClick={onOpen} className="block w-full text-left cursor-pointer" aria-label={`Open ${room.name}`}>
                <div className="dot-grid flex h-36 items-center justify-center rounded-t-3xl border-b border-sand bg-sand/40">
                    <span className="font-display text-6xl text-olive/70 transition-transform group-hover:scale-110" aria-hidden="true">
                        {room.name[0]?.toUpperCase()}
                    </span>
                </div>

                <div className="px-5 py-4 pr-14">
                    <h3 className="truncate font-medium text-ink">{room.name}</h3>
                    <p className="mt-0.5 text-sm text-olive">Edited {timeAgo(room.updatedAt)}</p>
                </div>
            </button>

            <div className="absolute bottom-4 right-3">
                <Menu
                    items={[
                        { label: "Rename", icon: <FiEdit2 aria-hidden="true" />, onSelect: onRename },
                        { label: "Copy invite link", icon: <FiLink aria-hidden="true" />, onSelect: onCopy },
                        { label: "Delete", icon: <FiTrash2 aria-hidden="true" />, onSelect: onDelete, danger: true },
                    ]}
                    trigger={({ open, toggle }) => (
                        <button
                            onClick={toggle}
                            aria-haspopup="menu"
                            aria-expanded={open}
                            aria-label={`Options for ${room.name}`}
                            className="flex size-9 items-center justify-center rounded-full text-olive cursor-pointer hover:bg-sand hover:text-ink"
                        >
                            <FiMoreHorizontal aria-hidden="true" />
                        </button>
                    )}
                />
            </div>
        </article>
    );
}

function SkeletonCard() {
    return (
        <div className="animate-pulse rounded-3xl border border-sand">
            <div className="h-36 rounded-t-3xl bg-sand/60" />
            <div className="space-y-2 px-5 py-4">
                <div className="h-4 w-2/3 rounded bg-sand" />
                <div className="h-3 w-1/3 rounded bg-sand" />
            </div>
        </div>
    );
}

// A name form used by both "New board" and "Rename".
function NameForm({ initialName = "", submitLabel, onSubmit, onCancel }) {
    const [name, setName] = useState(initialName);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmed = name.trim();

        if (!trimmed) {
            setError("Give your board a name");
            return;
        }

        setSaving(true);
        const failure = await onSubmit(trimmed);

        if (failure) {
            setError(failure);
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Input
                label="Board name"
                placeholder="e.g. Sprint planning"
                maxLength={MAX_NAME_LENGTH}
                value={name}
                error={error}
                onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                }}
            />

            <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" loading={saving}>{submitLabel}</Button>
            </div>
        </form>
    );
}

function Dashboard() {
    const { user, authenticatedFetch } = useAuth();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [joinValue, setJoinValue] = useState("");
    const [joinError, setJoinError] = useState("");
    // { type: "create" } | { type: "rename", room } | { type: "delete", room }
    const [dialog, setDialog] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const closeDialog = useCallback(() => setDialog(null), []);

    const loadRooms = useCallback(async () => {
        setLoadError("");

        try {
            const response = await authenticatedFetch(API);

            if (!response.ok) throw new Error(await readError(response, "Could not load your boards"));

            setRooms((await response.json()).rooms);
        } catch (error) {
            setLoadError(error.message || "Could not load your boards");
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    const createBoard = async (name) => {
        try {
            const response = await authenticatedFetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) return readError(response, "Could not create the board");

            const { room } = await response.json();
            navigate(`/board/${room.roomId}`);
            return null;
        } catch {
            return "Could not create the board";
        }
    };

    const renameBoard = async (room, name) => {
        try {
            const response = await authenticatedFetch(`${API}/${room.roomId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) return readError(response, "Could not rename the board");

            const { room: renamed } = await response.json();
            setRooms((current) => current.map((r) => (r.roomId === renamed.roomId ? renamed : r)));
            setDialog(null);
            toast.success("Board renamed");
            return null;
        } catch {
            return "Could not rename the board";
        }
    };

    const deleteBoard = async (room) => {
        setDeleting(true);

        try {
            const response = await authenticatedFetch(`${API}/${room.roomId}`, { method: "DELETE" });

            if (!response.ok && response.status !== 404) throw new Error(await readError(response, "Could not delete the board"));

            setRooms((current) => current.filter((r) => r.roomId !== room.roomId));
            setDialog(null);
            toast.success(`Deleted "${room.name}"`);
        } catch (error) {
            toast.error(error.message || "Could not delete the board");
        } finally {
            setDeleting(false);
        }
    };

    const copyLink = async (room) => {
        try {
            await navigator.clipboard.writeText(inviteLink(room.roomId));
            toast.success("Invite link copied");
        } catch {
            toast.error("Could not copy. Open the board and copy the address bar instead.");
        }
    };

    const handleJoin = (event) => {
        event.preventDefault();

        const roomId = parseRoomInput(joinValue);

        if (!roomId) {
            setJoinError("Paste an invite link or a 12-character board ID");
            return;
        }

        navigate(`/board/${roomId}`);
    };

    const firstName = user?.username ?? "";

    return (
        <div className="min-h-screen bg-paper">
            <AppHeader />

            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm text-olive">Hello, {firstName}</p>
                        <h1 className="mt-1 font-display text-5xl">Your boards</h1>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <form onSubmit={handleJoin} noValidate className="flex gap-2 sm:w-96">
                            <Input
                                aria-label="Invite link or board ID"
                                placeholder="Paste an invite link or board ID"
                                className="flex-1"
                                value={joinValue}
                                error={joinError}
                                onChange={(event) => {
                                    setJoinValue(event.target.value);
                                    setJoinError("");
                                }}
                            />
                            <Button type="submit" variant="secondary">Join</Button>
                        </form>

                        <Button onClick={() => setDialog({ type: "create" })}>
                            <FiPlus aria-hidden="true" />
                            New board
                        </Button>
                    </div>
                </div>

                <section className="mt-10" aria-live="polite">
                    {loadError ? (
                        <div className="rounded-3xl border border-bone px-6 py-14 text-center">
                            <p className="text-ink">{loadError}</p>
                            <Button variant="secondary" className="mt-4" onClick={loadRooms}>Try again</Button>
                        </div>
                    ) : rooms === null ? (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="dot-grid rounded-[2rem] border border-bone bg-sand/40 px-6 py-20 text-center">
                            <h2 className="font-display text-4xl">A blank page is a good start.</h2>
                            <p className="mx-auto mt-2 max-w-sm text-olive">
                                Create your first board, then share its link to draw with someone.
                            </p>
                            <Button className="mt-8" onClick={() => setDialog({ type: "create" })}>
                                <FiPlus aria-hidden="true" />
                                Create your first board
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="mb-4 text-sm text-olive">
                                {rooms.length} {rooms.length === 1 ? "board" : "boards"}
                            </p>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {rooms.map((room) => (
                                    <BoardCard
                                        key={room.roomId}
                                        room={room}
                                        onOpen={() => navigate(`/board/${room.roomId}`)}
                                        onRename={() => setDialog({ type: "rename", room })}
                                        onCopy={() => copyLink(room)}
                                        onDelete={() => setDialog({ type: "delete", room })}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>

            <Modal open={dialog?.type === "create"} title="New board" description="You can rename it later." onClose={closeDialog}>
                <NameForm submitLabel="Create board" onSubmit={createBoard} onCancel={closeDialog} />
            </Modal>

            <Modal open={dialog?.type === "rename"} title="Rename board" onClose={closeDialog}>
                {dialog?.type === "rename" && (
                    <NameForm
                        initialName={dialog.room.name}
                        submitLabel="Save"
                        onSubmit={(name) => renameBoard(dialog.room, name)}
                        onCancel={closeDialog}
                    />
                )}
            </Modal>

            <Modal
                open={dialog?.type === "delete"}
                title="Delete this board?"
                description={dialog?.type === "delete" ? `"${dialog.room.name}" and everything drawn on it will be removed for everyone. This cannot be undone.` : ""}
                onClose={closeDialog}
            >
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
                    <Button variant="danger" loading={deleting} onClick={() => deleteBoard(dialog.room)}>Delete board</Button>
                </div>
            </Modal>
        </div>
    );
}

export default Dashboard;
