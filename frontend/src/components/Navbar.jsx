import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <header className="site-header">
            <Link to="/" className="site-header__brand">
                Library Management System
            </Link>

            <nav className="site-header__nav" aria-label="Site navigation">
                {isAuthenticated ? (
                    <>
                        <span className="site-header__user" aria-label={`Signed in as ${user?.name}`}>
                            {user?.name}
                        </span>
                        <button
                            type="button"
                            className="site-header__logout"
                            onClick={logout}
                        >
                            Sign out
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="site-header__link">Sign in</Link>
                        <Link to="/register" className="site-header__link">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Navbar;
