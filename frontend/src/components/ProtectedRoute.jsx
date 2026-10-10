import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Wraps a route that requires authentication and optionally a specific role.
 *
 * - Unauthenticated  → /login with { from } in state, redirected back after login.
 * - Wrong role       → inline "no access" message (no redirect).
 * - Logged-in user on /login or /register → home (handled in those pages).
 */
const ProtectedRoute = ({ children, role }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role && user?.role !== role) {
        return (
            <main className="no-access">
                <h1>Access denied</h1>
                <p>You do not have access to this page.</p>
            </main>
        );
    }

    return children;
};

export default ProtectedRoute;
