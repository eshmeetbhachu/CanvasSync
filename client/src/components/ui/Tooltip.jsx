// Shows `label` above its child on hover or keyboard focus; the child should carry its own aria-label.
function Tooltip({ label, children, side = "bottom" }) {
    return (
        <span className="group/tip relative inline-flex">
            {children}
            <span
                role="tooltip"
                className={`pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs text-paper opacity-0 transition-opacity group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 ${
                    side === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
                }`}
            >
                {label}
            </span>
        </span>
    );
}

export default Tooltip;
