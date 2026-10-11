import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerOn401 } from "../services/api.js";
import { login as apiLogin, register as apiRegister } from "../services/authService.js";
import { parseStoredSession } from "../utils/jwt.js";

const STORAGE_KEY = "lms_session";

const AuthContext = createContext(null);

const loadSession = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const session = parseStoredSession(raw);
        if (!session) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return session;
    } catch {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {}
        return null;
    }
};

const saveSession = (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
};

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Stable ref so registerOn401 callback doesn't stale-close over navigate.
    const navigateRef = useRef(navigate);
    navigateRef.current = navigate;

    // Restore session on mount.
    useEffect(() => {
        const session = loadSession();
        if (session) {
            setUser(session.user);
            setToken(session.token);
        }
        setLoading(false);
    }, []);

    // Register the 401 callback with api.js once.
    useEffect(() => {
        registerOn401(() => {
            clearSession();
            setUser(null);
            setToken(null);
            navigateRef.current("/login", { state: { expired: true } });
        });
    }, []);

    const login = useCallback(async ({ email, password }) => {
        const { token: newToken, user: newUser } = await apiLogin({ email, password });
        const session = { token: newToken, user: newUser };
        saveSession(session);
        setToken(newToken);
        setUser(newUser);
        return newUser;
    }, []);

    const register = useCallback(async ({ name, email, password }) => {
        const { token: newToken, user: newUser } = await apiRegister({ name, email, password });
        const session = { token: newToken, user: newUser };
        saveSession(session);
        setToken(newToken);
        setUser(newUser);
        return newUser;
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setToken(null);
        setUser(null);
        navigate("/login");
    }, [navigate]);

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <p style={{ padding: "2rem", fontFamily: "system-ui" }}>Loading…</p>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
};

export { AuthProvider, useAuth };
