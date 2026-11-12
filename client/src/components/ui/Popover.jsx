import { useEffect, useRef, useState } from "react";

// A small panel under its trigger; closes on outside click, Escape, or when content calls close().
function Popover({ trigger, children, align = "center" }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const position = align === "center" ? "left-1/2 -translate-x-1/2" : align === "right" ? "right-0" : "left-0";

    return (
        <div ref={rootRef} className="relative">
            {trigger({ open, toggle: () => setOpen((value) => !value) })}

            {open && (
                <div className={`absolute top-full z-40 mt-3 w-max rounded-2xl border border-bone bg-paper p-3 shadow-lg ${position}`}>
                    {children({ close: () => setOpen(false) })}
                </div>
            )}
        </div>
    );
}

export default Popover;
