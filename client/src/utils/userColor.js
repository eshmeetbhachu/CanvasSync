// Earthy tones that sit well on Floral White; a user keeps the same colour on every screen.
export const USER_COLORS = ["#8A5A44", "#4F6D5A", "#3E5C76", "#A07A2C", "#6B4E71", "#565449", "#7A3E48", "#2F5F5F"];

export const colorForUser = (userId = "") => {
    let hash = 0;

    for (const char of String(userId)) {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }

    return USER_COLORS[hash % USER_COLORS.length];
};
