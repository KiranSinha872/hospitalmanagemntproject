import { request } from "./api.js";

/**
 * Fetch list of books from the catalog.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
const getBooks = async ({ signal } = {}) => {
    const res = await request("/books", { signal });
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
