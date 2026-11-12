import { useNavigate } from "react-router-dom";
import { FiEdit3, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import Logo from "../ui/Logo";
import Menu from "../ui/Menu";

function AppHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const initial = user?.username?.[0]?.toUpperCase() ?? "?";

    // Leave the protected page first; otherwise its guard redirects to /login as soon as the session clears.
    const handleLogout = async () => {
        navigate("/", { replace: true });
        await logout();
    };

    return (
        <header className="border-b border-sand bg-paper">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Logo to="/dashboard" />

                <Menu
                    header={
                        <>
                            <p className="text-sm font-medium text-ink">{user?.username}</p>
                            <p className="text-xs text-olive">{user?.email}</p>
                        </>
                    }
                    items={[
                        { label: "Help train the AI", icon: <FiEdit3 aria-hidden="true" />, onSelect: () => navigate("/collect") },
                        { label: "Log out", icon: <FiLogOut aria-hidden="true" />, onSelect: handleLogout },
                    ]}
                    trigger={({ open, toggle }) => (
                        <button
                            onClick={toggle}
                            aria-haspopup="menu"
                            aria-expanded={open}
                            aria-label="Account menu"
                            className="flex size-10 items-center justify-center rounded-full bg-ink font-display text-xl text-paper cursor-pointer hover:bg-olive"
                        >
                            {initial}
                        </button>
                    )}
                />
            </div>
        </header>
    );
}

export default AppHeader;
