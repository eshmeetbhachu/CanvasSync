import { colorForUser } from "../utils/userColor";

// The +16 offsets match the canvas container's padding.
function RemoteCursor({ cursor }) {
    const color = colorForUser(cursor.userId);

    return (
        <div
            className="absolute pointer-events-none"
            style={{
                left: cursor.x + 16,
                top: cursor.y + 16,
            }}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 2L18 15L11 15L8 22L6 21L9 14L3 2Z" fill={color} stroke="#FFFBF4" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>

            <div
                className="mt-1 w-fit rounded-full px-2.5 py-0.5 text-xs font-medium text-paper shadow-md"
                style={{ backgroundColor: color }}
            >
                {cursor.name}
            </div>
        </div>
    );
}

export default RemoteCursor;
