import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const validate = ({ username, email, password }) => {
    const errors = {};

    if (!username.trim()) errors.username = "Choose a username";
    else if (username.trim().length > 30) errors.username = "Keep it under 30 characters";

    if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address";

    if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;

    return errors;
};

// On success the user is logged in, and PublicOnlyRoute moves them on to the dashboard.
function Signup() {
    const { signup } = useAuth();
    const location = useLocation();

    const [fields, setFields] = useState({ username: "", email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const update = (name) => (event) => setFields((current) => ({ ...current, [name]: event.target.value }));

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = validate(fields);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);

        try {
            await signup(fields.username.trim(), fields.email.trim(), fields.password);
        } catch (error) {
            setErrors({
                form: error.message === "User already exists"
                    ? "That username or email is already taken."
                    : error.message,
            });
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Free, and ready in under a minute."
            footer={
                <>
                    Already have an account?{" "}
                    <Link to="/login" state={location.state} className="font-medium text-ink underline-offset-4 hover:underline">
                        Log in
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <Input
                    label="Username"
                    autoComplete="username"
                    hint="Shown on your cursor to collaborators."
                    value={fields.username}
                    error={errors.username}
                    onChange={update("username")}
                />

                <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    error={errors.email}
                    onChange={update("email")}
                />

                <PasswordInput
                    label="Password"
                    autoComplete="new-password"
                    hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                    value={fields.password}
                    error={errors.password}
                    onChange={update("password")}
                />

                {errors.form && (
                    <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                        {errors.form}
                    </p>
                )}

                <Button type="submit" size="lg" loading={submitting} className="w-full">
                    Create account
                </Button>
            </form>
        </AuthLayout>
    );
}

export default Signup;
