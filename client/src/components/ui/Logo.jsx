import { Link } from "react-router-dom";

function Logo({ to = "/", light = false }) {
    return (
        <Link to={to} className={`inline-flex items-center gap-2.5 ${light ? "text-paper" : "text-ink"}`}>
            <svg viewBox="0 0 64 64" className="size-8" aria-hidden="true">
                <rect width="64" height="64" rx="14" fill={light ? "#FFFBF4" : "#11120D"} />
                <path
                    d="M16 40c6-14 12-18 17-13s9 6 15-6"
                    fill="none"
                    stroke={light ? "#11120D" : "#FFFBF4"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle cx="48" cy="21" r="4" fill="#D8CFBC" />
            </svg>
            <span className="font-display text-2xl leading-none">CanvasSync</span>
        </Link>
    );
}

export default Logo;
