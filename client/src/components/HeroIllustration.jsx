// A board mid-session: strokes draw themselves in while two collaborators' cursors drift.
// pathLength="1" lets every stroke use the same draw-in animation whatever its real length.
const STROKES = [
    { d: "M120 150c-4-44 52-70 96-54 40 14 50 62 18 88-34 28-108 20-114-34z", delay: "0.2s" },
    { d: "M300 92l150 4-2 104-150-6z", delay: "0.9s" },
    { d: "M226 150c26-2 50 0 70-4m-14-14 16 14-18 12", delay: "1.6s" },
    { d: "M110 282c30-18 58 14 88-2s56-16 84 0 60 10 92-6", delay: "2.2s" },
    { d: "M402 252l40 64h-84z", delay: "2.8s" },
];

function Cursor({ x, y, name, dark, className }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <g className={className}>
                <path d="M0 0l0 22 6-6 5 11 4-2-5-11 9 0z" fill={dark ? "#11120D" : "#565449"} stroke="#FFFBF4" strokeWidth="1.5" />
                <rect x="14" y="22" rx="8" width={name.length * 8 + 18} height="20" fill={dark ? "#11120D" : "#565449"} />
                <text x="23" y="36" fill="#FFFBF4" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="500">
                    {name}
                </text>
            </g>
        </g>
    );
}

function HeroIllustration() {
    return (
        <svg viewBox="0 0 560 400" className="w-full h-auto" role="img" aria-label="Two people drawing shapes together on a shared board">
            <defs>
                <pattern id="hero-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="#565449" opacity="0.28" />
                </pattern>
            </defs>

            <rect x="1" y="1" width="558" height="398" rx="28" fill="#FFFBF4" stroke="#D8CFBC" strokeWidth="2" />
            <rect x="1" y="1" width="558" height="398" rx="28" fill="url(#hero-dots)" />

            <g>
                <rect x="190" y="22" width="180" height="34" rx="17" fill="#FFFBF4" stroke="#D8CFBC" />
                {[218, 246, 274].map((cx, index) => (
                    <circle key={cx} cx={cx} cy="39" r="7" fill={["#11120D", "#565449", "#D8CFBC"][index]} />
                ))}
                <rect x="298" y="34" width="50" height="10" rx="5" fill="#ECE6D9" />
            </g>

            {STROKES.map((stroke) => (
                <path
                    key={stroke.d}
                    d={stroke.d}
                    pathLength="1"
                    className="draw-in"
                    style={{ "--length": 1, "--delay": stroke.delay }}
                    fill="none"
                    stroke="#11120D"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ))}

            <Cursor x={442} y={198} name="Ana" dark className="drift" />
            <Cursor x={196} y={300} name="Sam" className="drift-slow" />
        </svg>
    );
}

export default HeroIllustration;
