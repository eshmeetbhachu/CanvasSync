import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Logo from "../ui/Logo";

function PublicNav() {
    const { accessToken } = useAuth();

    return (
        <header className="sticky top-0 z-30 border-b border-sand bg-paper/90 backdrop-blur">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Logo />

                <div className="hidden md:flex items-center gap-8 text-sm text-olive">
                    <a href="#features" className="hover:text-ink">Features</a>
                    <a href="#how-it-works" className="hover:text-ink">How it works</a>
                    <a href="#built-with" className="hover:text-ink">Built with</a>
                </div>

                <div className="flex items-center gap-2">
                    {accessToken ? (
                        <Button to="/dashboard" size="sm">Open dashboard</Button>
                    ) : (
                        <>
                            <Button to="/login" variant="ghost" size="sm">Log in</Button>
                            <Button to="/signup" size="sm">Get started</Button>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default PublicNav;
