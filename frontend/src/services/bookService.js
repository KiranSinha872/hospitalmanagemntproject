import { request } from "./api.js";
import { buildSearchQueryString } from "../utils/search.js";

/**
 * Fetch list of books from the catalog with optional search and category filters.
 * @param {{ q?: string, category?: string, signal?: AbortSignal, token?: string }} [options]
 * @returns {Promise<any>}
 */
const getBooks = async ({ q, category, signal, token } = {}) => {
    const qs = buildSearchQueryString({ q, category });
    const res = await request(`/books${qs}`, { signal, token });
    return res?.data ?? res;
};

/**
 * Fetch single book details by ID.
 * @param {string} id
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
const getBookById = async (id, { signal } = {}) => {
    const res = await request(`/books/${encodeURIComponent(id)}`, { signal });
    return res?.data ?? res;
};

export { getBooks, getBookById };
