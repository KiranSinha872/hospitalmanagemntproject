import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const MIN_PASSWORD = 8;

const validate = ({ name, email, password, confirmPassword }) => {
    const errors = {};
    if (!name.trim()) {
        errors.name = "Name is required.";
    }
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
    if (!confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
};

const Register = () => {
    const { register, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [fields, setFields] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
        confirmPassword: false,
    });
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmRef = useRef(null);
    const firstErrorRef = useRef(null);

    // Logged-in users should not see the register page.
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
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
        if (errs.name) { nameRef.current?.focus(); return; }
        if (errs.email) { emailRef.current?.focus(); return; }
        if (errs.password) { passwordRef.current?.focus(); return; }
        if (errs.confirmPassword) { confirmRef.current?.focus(); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ name: true, email: true, password: true, confirmPassword: true });
        if (Object.keys(errors).length) {
            focusFirstError(errors);
            return;
        }
        setLoading(true);
        setFormError("");
        try {
            await register({
                name: fields.name.trim(),
                email: fields.email,
                password: fields.password,
            });
            navigate("/", { replace: true });
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
                <h1 className="auth-form__heading">Create an account</h1>

                {formError && (
                    <p
                        id="register-form-error"
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
                        <label htmlFor="reg-name" className="auth-form__label">
                            Full name
                        </label>
                        <input
                            ref={nameRef}
                            id="reg-name"
                            type="text"
                            name="name"
                            className="auth-form__input"
                            autoComplete="name"
                            value={fields.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!touchedErrors.name}
                            aria-describedby={
                                touchedErrors.name ? "reg-name-error" : undefined
                            }
                            required
                        />
                        {touchedErrors.name && (
                            <span
                                id="reg-name-error"
                                className="auth-form__field-error"
                                role="alert"
                            >
                                {touchedErrors.name}
                            </span>
                        )}
                    </div>

                    <div className="auth-form__group">
                        <label htmlFor="reg-email" className="auth-form__label">
                            Email address
                        </label>
                        <input
                            ref={emailRef}
                            id="reg-email"
                            type="email"
                            name="email"
                            className="auth-form__input"
                            autoComplete="email"
                            value={fields.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!touchedErrors.email}
                            aria-describedby={
                                touchedErrors.email ? "reg-email-error" : undefined
                            }
                            required
                        />
                        {touchedErrors.email && (
                            <span
                                id="reg-email-error"
                                className="auth-form__field-error"
                                role="alert"
                            >
                                {touchedErrors.email}
                            </span>
                        )}
                    </div>

                    <div className="auth-form__group">
                        <label htmlFor="reg-password" className="auth-form__label">
                            Password
                        </label>
                        <input
                            ref={passwordRef}
                            id="reg-password"
                            type="password"
                            name="password"
                            className="auth-form__input"
                            autoComplete="new-password"
                            value={fields.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!touchedErrors.password}
                            aria-describedby={
                                touchedErrors.password
                                    ? "reg-password-error"
                                    : "reg-password-hint"
                            }
                            required
                        />
                        {touchedErrors.password ? (
                            <span
                                id="reg-password-error"
                                className="auth-form__field-error"
                                role="alert"
                            >
                                {touchedErrors.password}
                            </span>
                        ) : (
                            <span id="reg-password-hint" className="auth-form__hint">
                                At least {MIN_PASSWORD} characters.
                            </span>
                        )}
                    </div>

                    <div className="auth-form__group">
                        <label htmlFor="reg-confirm" className="auth-form__label">
                            Confirm password
                        </label>
                        <input
                            ref={confirmRef}
                            id="reg-confirm"
                            type="password"
                            name="confirmPassword"
                            className="auth-form__input"
                            autoComplete="new-password"
                            value={fields.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            aria-invalid={!!touchedErrors.confirmPassword}
                            aria-describedby={
                                touchedErrors.confirmPassword
                                    ? "reg-confirm-error"
                                    : undefined
                            }
                            required
                        />
                        {touchedErrors.confirmPassword && (
                            <span
                                id="reg-confirm-error"
                                className="auth-form__field-error"
                                role="alert"
                            >
                                {touchedErrors.confirmPassword}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="auth-form__submit"
                        disabled={loading}
                    >
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>

                <p className="auth-form__switch">
                    Already registered?{" "}
                    <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
