// Must match the room ids the server generates (12 lowercase hex characters).
const ROOM_ID_PATTERN = /^[a-f0-9]{12}$/;

// Accepts a bare board id or a full invite link like https://site/board/abc123def456; returns the id or null.
export const parseRoomInput = (input) => {
    const value = input.trim();

    if (ROOM_ID_PATTERN.test(value)) return value;

    const match = value.match(/\/board\/([a-f0-9]{12})(?:[/?#]|$)/);

    return match ? match[1] : null;
};

export const inviteLink = (roomId) => `${window.location.origin}/board/${roomId}`;
