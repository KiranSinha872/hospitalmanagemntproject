import { request } from "./api.js";

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} body
 * @returns {Promise<{ token: string, user: object }>}
 */
const register = async ({ name, email, password }) => {
    const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email: email.trim(), password }),
    });
    return data.data;
};

/**
 * Authenticate an existing user.
 * @param {{ email: string, password: string }} body
 * @returns {Promise<{ token: string, user: object }>}
 */
const login = async ({ email, password }) => {
    const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
    });
    return data.data;
};

export { login, register };
