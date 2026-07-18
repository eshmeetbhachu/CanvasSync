function RemoteCursor({ cursor }) {
    return (
        <div
            className="absolute pointer-events-none"
            style={{
                left: cursor.x + 16,
                top: cursor.y + 16,
            }}
        >
            {/* Cursor Arrow */}
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="black"
            >
                <path d="M3 2L18 15L11 15L8 22L6 21L9 14L3 2Z" />
            </svg>

            {/* Username */}
            <div
                className="mt-1 rounded-md bg-black px-2 py-1 text-xs text-white shadow-md w-fit"
            >
                {cursor.name}
            </div>
        </div>
    );
}

export default RemoteCursor;