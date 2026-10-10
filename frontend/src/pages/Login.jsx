import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Minimum password length must match the backend bcrypt rule.
const MIN_PASSWORD = 8;

const validate = ({ email, password }) => {
    const errors = {};
    if (!email.trim()) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "Enter a valid email address.";
    }
    if (!password) {
        errors.password = "Password is required.";
    } else if (password.length < MIN_PASSWORD) {
        errors.password = `Password must be at least ${MIN_PASSWORD} characters.`;
    }
    return errors;
};

const Login = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";
    const expired = location.state?.expired;

    const [fields, setFields] = useState({ email: "", password: "" });
    const [touched, setTouched] = useState({ email: false, password: false });
    const [formError, setFormError] = useState(expired
        ? "Your session has expired. Please sign in again."
        : "");
    const [loading, setLoading] = useState(false);

    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const firstErrorRef = useRef(null);

    // Logged-in users should not see the login page.
    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    const errors = validate(fields);
    const touchedErrors = Object.fromEntries(
        Object.entries(errors).filter(([k]) => touched[k])
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFields((prev) => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e) => {
        setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    };

    const focusFirstError = (errs) => {
        if (errs.email) { emailRef.current?.focus(); return; }
        if (errs.password) { passwordRef.current?.focus(); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        if (Object.keys(errors).length) {
            focusFirstError(errors);
            return;
        }
        setLoading(true);
        setFormError("");
        try {
            await login({ email: fields.email, password: fields.password });
            navigate(from, { replace: true });
        } catch (err) {
            setFormError(err.message);
            firstErrorRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-panel auth-panel--info" aria-hidden="true">
                <p className="auth-panel__library">Dewey Library</p>
                <p className="auth-panel__tagline">
                    Borrow, return and search the catalogue.
                </p>
            </div>

            <div className="auth-panel auth-panel--form">
                <h1 className="auth-form__heading">Sign in to your account</h1>

                {formError && (
                    <p
                        id="login-form-error"
                        className="auth-form__banner"
                        role="alert"
                        tabIndex={-1}
                        ref={firstErrorRef}
                    >
                        {formError}
                    </p>
                )}

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="auth-form__group">
                        <label htmlFor="login-email" className="auth-form__label">
                            Email address
                        </label>
                        <input
                            ref={emailRef}
                            id="login-email"
                            type="email"
                            name="email"
                            className="auth-form__input"
                            autoComplete="email"
                            value={fields.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!touchedErrors.email}
                            aria-describedby={
                                touchedErrors.email
                                    ? "login-email-error"
                                    : undefined
                            }
                            required
                        />
                        {touchedErrors.email && (
                            <span
                                id="login-email-error"
                                className="auth-form__field-error"
                                role="alert"
                            >
                                {touchedErrors.email}
                            </span>
                        )}
                    </div>

                    <div className="auth-form__group">
                        <label htmlFor="login-password" className="auth-form__label">
                            Password
                        </label>
                        <input
                            ref={passwordRef}
                            id="login-password"
                            type="password"
                            name="password"
                            className="auth-form__input"
                            autoComplete="current-password"
                            value={fields.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!touchedErrors.password}
                            aria-describedby={
                                touchedErrors.password
                                    ? "login-password-error"
                                    : undefined
                            }
                            required
                        />
                        {touchedErrors.password && (
                            <span
                                id="login-password-error"
                                className="auth-form__field-error"
                                role="alert"
                            >
                                {touchedErrors.password}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="auth-form__submit"
                        disabled={loading}
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <p className="auth-form__switch">
                    New here?{" "}
                    <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
