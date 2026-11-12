import Logo from "../ui/Logo";

// Form on the left; on wide screens a dark brand panel on the right.
function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="grid min-h-screen bg-paper lg:grid-cols-2">
            <div className="flex flex-col px-6 py-8 sm:px-12">
                <Logo />

                <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
                    <h1 className="font-display text-5xl">{title}</h1>
                    <p className="mt-2 text-olive">{subtitle}</p>

                    <div className="mt-8">{children}</div>

                    <p className="mt-8 text-sm text-olive">{footer}</p>
                </main>
            </div>

            <aside className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-end lg:p-14" aria-hidden="true">
                <svg viewBox="0 0 400 300" className="absolute -right-10 top-16 w-[85%] opacity-90">
                    <path d="M60 160c-6-60 70-96 130-74 54 20 68 84 24 120-46 38-146 28-154-46z" fill="none" stroke="#D8CFBC" strokeWidth="3" strokeLinecap="round" />
                    <path d="M230 70l140 6-3 98-140-6z" fill="none" stroke="#565449" strokeWidth="3" strokeLinejoin="round" />
                    <path d="M70 260c30-18 58 14 88-2s56-16 84 0 60 10 92-6" fill="none" stroke="#D8CFBC" strokeWidth="3" strokeLinecap="round" />
                </svg>

                <p className="relative font-display text-5xl leading-tight text-paper">
                    “The best ideas start as a <em className="text-bone">rough sketch</em> someone else can add to.”
                </p>
                <p className="relative mt-4 text-sm text-bone">CanvasSync</p>
            </aside>
        </div>
    );
}

export default AuthLayout;
