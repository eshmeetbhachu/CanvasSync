import Logo from "../ui/Logo";
import AccountMenu from "./AccountMenu";

function AppHeader() {
    return (
        <header className="border-b border-sand bg-paper">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Logo to="/dashboard" />
                <AccountMenu />
            </div>
        </header>
    );
}

export default AppHeader;
