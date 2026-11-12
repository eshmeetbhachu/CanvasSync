import { Link } from "react-router-dom";

const VARIANTS = {
    primary: "bg-ink text-paper hover:bg-olive",
    secondary: "bg-paper text-ink border border-bone hover:border-olive",
    ghost: "text-olive hover:text-ink hover:bg-sand",
    light: "bg-paper text-ink hover:bg-bone",
    danger: "bg-danger text-paper hover:opacity-90",
};

const SIZES = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
};

// Renders a router Link when `to` is given, otherwise a <button>.
function Button({ variant = "primary", size = "md", to, loading = false, className = "", children, disabled, ...props }) {
    const classes = `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

    if (to) {
        return (
            <Link to={to} className={classes} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
            {loading && (
                <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
            )}
            {children}
        </button>
    );
}

export default Button;
