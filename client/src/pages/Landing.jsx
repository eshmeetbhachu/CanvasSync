import { FiCornerUpLeft, FiGithub, FiLink, FiMousePointer, FiRefreshCw, FiUsers, FiZap } from "react-icons/fi";
import Button from "../components/ui/Button";
import HeroIllustration from "../components/HeroIllustration";
import PublicNav from "../components/layout/PublicNav";
import Footer from "../components/layout/Footer";
import { GITHUB_URL } from "../constants/links";

const FEATURES = [
    {
        icon: FiUsers,
        title: "Draw together, live",
        text: "Everyone in a room sees every stroke the moment it is saved. No refresh, no merging.",
    },
    {
        icon: FiMousePointer,
        title: "See who is where",
        text: "Live cursors with names show exactly what each person is working on.",
    },
    {
        icon: FiLink,
        title: "Share with one link",
        text: "Every board gets its own link. Send it, and your teammate is drawing with you.",
    },
    {
        icon: FiCornerUpLeft,
        title: "Undo that is yours",
        text: "Undo and redo only touch your own changes, never a collaborator's work.",
    },
    {
        icon: FiRefreshCw,
        title: "Survives a bad connection",
        text: "Lose Wi-Fi mid-stroke and keep drawing. Your changes are sent the moment you are back.",
    },
    {
        icon: FiZap,
        title: "Shape snapping",
        text: "A small neural network that turns a rough circle into a clean one.",
        badge: "In progress",
    },
];

const STEPS = [
    { title: "Create a board", text: "Give it a name. It is saved to your dashboard." },
    { title: "Share the link", text: "Copy the invite link and send it to anyone with an account." },
    { title: "Draw together", text: "Sketch, erase and undo, and watch everyone's cursors move." },
];

const STATS = [
    { value: "1,000", label: "simulated users in a load test" },
    { value: "59 ms", label: "p95 time to save a stroke under that load" },
    { value: "0", label: "boards out of sync after random disconnects" },
];

const STACK = ["React", "Socket.IO", "Node.js", "MongoDB", "Redis", "PyTorch"];

function Landing() {
    return (
        <div className="bg-paper text-ink">
            <PublicNav />

            <main>
                <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-24">
                    <div>
                        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-bone px-3 py-1 text-xs font-medium uppercase tracking-wider text-olive">
                            Real-time collaborative whiteboard
                        </p>

                        <h1 className="font-display text-6xl leading-[0.95] sm:text-7xl">
                            Sketch ideas together, <em className="text-olive">in real time.</em>
                        </h1>

                        <p className="mt-6 max-w-md text-lg text-olive">
                            Open a board, send the link, and think out loud with your team on one shared canvas.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button to="/signup" size="lg">Start drawing, it's free</Button>
                            <Button to="/login" variant="secondary" size="lg">Log in</Button>
                        </div>
                    </div>

                    <HeroIllustration />
                </section>

                <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
                    <h2 className="font-display text-5xl">Everything a shared board needs.</h2>
                    <p className="mt-3 max-w-xl text-olive">Nothing it doesn't.</p>

                    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map(({ icon: Icon, title, text, badge }) => (
                            <article key={title} className="rounded-3xl border border-bone bg-paper p-6 transition-colors hover:bg-sand/60">
                                <div className="flex items-center justify-between">
                                    <span className="flex size-11 items-center justify-center rounded-2xl bg-sand text-ink">
                                        <Icon aria-hidden="true" />
                                    </span>
                                    {badge && (
                                        <span className="rounded-full bg-bone px-2.5 py-1 text-xs font-medium text-ink">{badge}</span>
                                    )}
                                </div>
                                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-olive">{text}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="how-it-works" className="scroll-mt-16 bg-ink text-paper">
                    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
                        <h2 className="font-display text-5xl">From blank page to shared board in three steps.</h2>

                        <ol className="mt-14 grid gap-10 md:grid-cols-3">
                            {STEPS.map((step, index) => (
                                <li key={step.title} className="border-t border-olive pt-6">
                                    <span className="font-display text-6xl text-bone">0{index + 1}</span>
                                    <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-bone">{step.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section id="built-with" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
                    <h2 className="font-display text-5xl">Built to stay in sync.</h2>
                    <p className="mt-3 max-w-2xl text-olive">
                        The server writes every change to the database before anyone sees it, so every screen ends up showing the same board.
                        Numbers below are from local load and stress tests.
                    </p>

                    <dl className="mt-12 grid gap-8 sm:grid-cols-3">
                        {STATS.map((stat) => (
                            <div key={stat.label}>
                                <dt className="sr-only">{stat.label}</dt>
                                <dd className="font-display text-6xl">{stat.value}</dd>
                                <p className="mt-1 text-sm text-olive">{stat.label}</p>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-12 flex flex-wrap items-center gap-2">
                        {STACK.map((name) => (
                            <span key={name} className="rounded-full border border-bone px-4 py-1.5 text-sm text-olive">{name}</span>
                        ))}
                        <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1 inline-flex items-center gap-2 text-sm font-medium text-ink underline-offset-4 hover:underline"
                        >
                            <FiGithub aria-hidden="true" />
                            Read the source
                        </a>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
                    <div className="dot-grid rounded-[2rem] border border-bone bg-sand/50 px-6 py-16 text-center">
                        <h2 className="font-display text-5xl">Your next idea needs a board.</h2>
                        <p className="mx-auto mt-3 max-w-md text-olive">Free to use. Create one in seconds.</p>
                        <Button to="/signup" size="lg" className="mt-8">Create your first board</Button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default Landing;
