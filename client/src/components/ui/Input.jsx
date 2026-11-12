import { useId } from "react";

// A labelled text input with an optional error message announced to screen readers.
function Input({ label, error, hint, trailing, className = "", ...props }) {
    const id = useId();
    const messageId = `${id}-message`;
    const message = error || hint;

    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-ink mb-1.5">
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    id={id}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={message ? messageId : undefined}
                    className={`w-full h-11 rounded-xl border bg-paper px-4 text-ink placeholder:text-olive/60 transition-colors focus:outline-none focus:border-ink ${
                        trailing ? "pr-12" : ""
                    } ${error ? "border-danger" : "border-bone hover:border-olive"}`}
                    {...props}
                />

                {trailing && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        {trailing}
                    </div>
                )}
            </div>

            {message && (
                <p id={messageId} className={`mt-1.5 text-sm ${error ? "text-danger" : "text-olive"}`}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default Input;
