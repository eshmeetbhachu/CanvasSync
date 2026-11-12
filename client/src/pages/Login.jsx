import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";

// After a successful login, PublicOnlyRoute moves the user on (to the invite link they opened, or the dashboard).
function Login() {
    const { login } = useAuth();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const cameFromInvite = location.state?.from?.startsWith?.("/board/");

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = {};
        if (!email.trim()) nextErrors.email = "Enter your email";
        if (!password) nextErrors.password = "Enter your password";
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);

        try {
            await login(email.trim(), password);
        } catch (error) {
            setErrors({ form: error.message });
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle={cameFromInvite ? "Log in to open the board you were invited to." : "Log in to get back to your boards."}
            footer={
                <>
                    New to CanvasSync?{" "}
                    <Link to="/signup" state={location.state} className="font-medium text-ink underline-offset-4 hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    error={errors.email}
                    onChange={(event) => setEmail(event.target.value)}
                />

                <PasswordInput
                    label="Password"
                    autoComplete="current-password"
                    value={password}
                    error={errors.password}
                    onChange={(event) => setPassword(event.target.value)}
                />

                {errors.form && (
                    <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                        {errors.form}
                    </p>
                )}

                <Button type="submit" size="lg" loading={submitting} className="w-full">
                    Log in
                </Button>
            </form>
        </AuthLayout>
    );
}

export default Login;
