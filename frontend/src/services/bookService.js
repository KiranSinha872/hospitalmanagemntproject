import { request } from "./api.js";

const getStoredToken = () => {
    try {
        const raw = localStorage.getItem("lms_session");
        if (!raw) return undefined;
        const parsed = JSON.parse(raw);
        return parsed?.token || undefined;
    } catch {
        return undefined;
    }
};

/**
 * Fetch list of books from the catalog.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
const getBooks = async ({ signal, ...options } = {}) => {
    const res = await request("/books", { signal, ...options });
    return res?.data ?? res;
};

/**
 * Fetch single book details by ID.
 * @param {string} id
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
const getBookById = async (id, { signal, ...options } = {}) => {
    const res = await request(`/books/${encodeURIComponent(id)}`, { signal, ...options });
    return res?.data ?? res;
};

/**
 * Create a new book.
 * @param {object} data
 * @param {{ token?: string, signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
const createBook = async (data, options = {}) => {
    const token = options.token || getStoredToken();
    const res = await request("/books", {
        method: "POST",
        body: JSON.stringify(data),
        ...options,
        ...(token ? { token } : {}),
    });
    return res?.data ?? res;
};

/**
 * Update an existing book by ID.
 * @param {string} id
 * @param {object} data
 * @param {{ token?: string, signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
const updateBook = async (id, data, options = {}) => {
    const token = options.token || getStoredToken();
    const res = await request(`/books/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
        ...options,
        ...(token ? { token } : {}),
    });
    return res?.data ?? res;
};

/**
 * Delete a book by ID.
 * @param {string} id
 * @param {{ token?: string, signal?: AbortSignal }} [options]
 * @returns {Promise<any>}
 */
const deleteBook = async (id, options = {}) => {
    const token = options.token || getStoredToken();
    const res = await request(`/books/${encodeURIComponent(id)}`, {
        method: "DELETE",
        ...options,
        ...(token ? { token } : {}),
    });
    return res?.data ?? res;
};

export { getBooks, getBookById, createBook, updateBook, deleteBook };
