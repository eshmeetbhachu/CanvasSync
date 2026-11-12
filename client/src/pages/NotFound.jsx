import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

function NotFound() {
    const { accessToken } = useAuth();

    return (
        <div className="dot-grid flex min-h-screen flex-col bg-paper px-6 py-8">
            <Logo />

            <main className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="font-display text-[9rem] leading-none text-bone">404</p>
                <h1 className="mt-2 font-display text-5xl">This page was erased.</h1>
                <p className="mt-3 text-olive">Or it was never drawn in the first place.</p>
                <Button to={accessToken ? "/dashboard" : "/"} className="mt-8">
                    {accessToken ? "Back to your boards" : "Back to the home page"}
                </Button>
            </main>
        </div>
    );
}

export default NotFound;
