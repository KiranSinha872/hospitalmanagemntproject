const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

// Registered by AuthContext to clear session on a 401 from a credentialed request.
let _on401 = null;
const registerOn401 = (cb) => { _on401 = cb; };

const request = async (path, options = {}) => {
    const { token, ...restOptions } = options;

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...restOptions.headers,
    };

    let response;
    try {
        response = await fetch(`${baseUrl}${path}`, {
            ...restOptions,
            headers,
        });
    } catch {
        const err = new Error("Cannot reach the server. Check your connection and try again.");
        err.status = 0;
        throw err;
    }

    // Try to parse JSON; fall back gracefully.
    let data = null;
    try {
        data = await response.json();
    } catch {
        // body was empty or non-JSON
    }

    if (!response.ok) {
        // 401 from a credentialed request → notify AuthContext
        if (response.status === 401 && token && _on401) {
            _on401();
        }

        const err = new Error(userMessage(response.status, data));
        err.status = response.status;
        err.serverData = data;
        throw err;
    }

    return data;
};

const userMessage = (status, data) => {
    // Prefer a backend-provided message for 400 (field errors).
    if (status === 400) {
        return data?.error?.message || "Please check the details you entered.";
    }
    if (status === 401) return "Incorrect email or password.";
    if (status === 409) return "An account with this email already exists.";
    if (status >= 500) return "Something went wrong on our side. Please try again.";
    return data?.error?.message || "Request failed.";
};

export { request, registerOn401 };
