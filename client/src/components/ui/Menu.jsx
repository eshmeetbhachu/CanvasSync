import { useEffect, useRef, useState } from "react";

// A small dropdown: `trigger` renders the button, `items` are { label, onSelect, danger? }.
function Menu({ trigger, items, align = "right", header }) {
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

    return (
        <div ref={rootRef} className="relative">
            {trigger({
                open,
                toggle: (event) => {
                    event.stopPropagation();
                    setOpen((value) => !value);
                },
            })}

            {open && (
                <div
                    role="menu"
                    className={`absolute top-full mt-2 z-40 min-w-48 rounded-2xl border border-bone bg-paper p-1.5 shadow-lg ${
                        align === "right" ? "right-0" : "left-0"
                    }`}
                    onClick={(event) => event.stopPropagation()}
                >
                    {header && (
                        <div className="px-3 py-2 border-b border-sand mb-1">
                            {header}
                        </div>
                    )}

                    {items.map((item) => (
                        <button
                            key={item.label}
                            role="menuitem"
                            onClick={() => {
                                setOpen(false);
                                item.onSelect();
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm cursor-pointer hover:bg-sand ${
                                item.danger ? "text-danger" : "text-ink"
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Menu;
