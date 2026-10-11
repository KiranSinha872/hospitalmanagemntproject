/**
 * Base64url decodes and parses the payload of a JWT.
 * Returns null unless token is a non-empty string with exactly 3 non-empty
 * dot-separated parts, the payload base64url-decodes and JSON-parses to a plain object.
 * Never throws.
 *
 * @param {unknown} token
 * @returns {Record<string, unknown> | null}
 */
export const decodeJwtPayload = (token) => {
    if (typeof token !== "string" || !token) return null;
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some((p) => p.length === 0)) return null;

    try {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
            base64 += "=";
        }
        const decoded = atob(base64);
        const parsed = JSON.parse(decoded);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

/**
 * Checks whether a token is expired.
 * True if payload is null, exp is missing, not a number, not finite, <= 0,
 * or exp * 1000 <= now. False only for a valid finite future exp.
 *
 * @param {unknown} token
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export const isTokenExpired = (token, now = Date.now()) => {
    const payload = decodeJwtPayload(token);
    if (!payload) return true;
    if (
        typeof payload.exp !== "number" ||
        !Number.isFinite(payload.exp) ||
        payload.exp <= 0
    ) {
        return true;
    }
    return payload.exp * 1000 <= now;
};

/**
 * Validates and extracts a stored session from raw JSON string.
 * Returns { token, user } only if raw is valid JSON, token is a non-empty string,
 * user is a non-null object, and the token is not expired. Otherwise null.
 * Never throws.
 *
 * @param {unknown} raw
 * @param {number} [now=Date.now()]
 * @returns {{ token: string, user: Record<string, unknown> } | null}
 */
export const parseStoredSession = (raw, now = Date.now()) => {
    if (typeof raw !== "string" || !raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }
        if (typeof parsed.token !== "string" || !parsed.token) {
            return null;
        }
        if (!parsed.user || typeof parsed.user !== "object" || Array.isArray(parsed.user)) {
            return null;
        }
        if (isTokenExpired(parsed.token, now)) {
            return null;
        }
        return { token: parsed.token, user: parsed.user };
    } catch {
        return null;
    }
};
