import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Closes on Escape or a click outside the panel, and returns focus to where it was when it closes.
function Modal({ open, title, description, onClose, children }) {
    const panelRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;

        const previouslyFocused = document.activeElement;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") onCloseRef.current();
        };

        document.addEventListener("keydown", handleKeyDown);
        panelRef.current?.querySelector("input, button")?.focus();

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="w-full max-w-md rounded-3xl bg-paper p-7 shadow-xl"
            >
                <h2 id="modal-title" className="font-display text-3xl text-ink">
                    {title}
                </h2>

                {description && (
                    <p className="mt-2 text-sm text-olive">
                        {description}
                    </p>
                )}

                <div className="mt-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
