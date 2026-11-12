export const MAX_ROOM_NAME_LENGTH = 60;

// Returns the trimmed name, or null if it is not a usable board name.
export const sanitizeRoomName = (name) => {
    if (typeof name !== "string") return null;

    const trimmed = name.trim();

    if (trimmed.length === 0 || trimmed.length > MAX_ROOM_NAME_LENGTH) return null;

    return trimmed;
};
