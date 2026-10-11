/**
 * Form utilities and validation for book management.
 * Pure ES module without React dependencies.
 */

export const emptyBookForm = Object.freeze({
    title: "",
    author: "",
    ISBN: "",
    category: "",
    publisher: "",
    publicationYear: "",
    totalCopies: "1",
    availableCopies: "1",
    description: "",
});

/**
 * Normalizes an ISBN string by stripping whitespace and hyphens,
 * and converting any trailing check character to uppercase.
 * @param {any} val
 * @returns {string}
 */
export const normalizeIsbn = (val) => {
    if (typeof val !== "string") {
        if (val != null && typeof val !== "object") {
            val = String(val);
        } else {
            return "";
        }
    }
    return val.replace(/[-\s]/g, "").toUpperCase();
};

/**
 * Maps a book entity into form values.
 * @param {object|null|undefined} book
 * @returns {object}
 */
export const bookToFormValues = (book) => {
    if (!book || typeof book !== "object") {
        return { ...emptyBookForm };
    }
    return {
        title: book.title != null ? String(book.title) : "",
        author: book.author != null ? String(book.author) : "",
        ISBN: book.ISBN != null ? String(book.ISBN) : (book.isbn != null ? String(book.isbn) : ""),
        category: book.category != null ? String(book.category) : "",
        publisher: book.publisher != null ? String(book.publisher) : "",
        publicationYear: book.publicationYear != null ? String(book.publicationYear) : "",
        totalCopies: book.totalCopies !== undefined && book.totalCopies !== null
            ? String(book.totalCopies)
            : (book.total !== undefined && book.total !== null ? String(book.total) : ""),
        availableCopies: book.availableCopies !== undefined && book.availableCopies !== null
            ? String(book.availableCopies)
            : (book.available !== undefined && book.available !== null ? String(book.available) : ""),
        description: book.description != null ? String(book.description) : "",
    };
};

const parseInteger = (val) => {
    if (typeof val === "number") {
        if (!Number.isFinite(val) || Number.isNaN(val)) return null;
        if (!Number.isInteger(val)) return null;
        return val;
    }
    if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "") return null;
        if (!/^-?\d+$/.test(trimmed)) return null;
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;
        return parsed;
    }
    return null;
};

/**
 * Validates book form values and returns { valid, errors }.
 * Never throws.
 * @param {object} rawValues
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export const validateBookForm = (rawValues) => {
    const values = rawValues && typeof rawValues === "object" ? rawValues : {};
    const errors = {};

    // Title
    const rawTitle = values.title != null ? String(values.title) : "";
    if (rawTitle.trim() === "") {
        errors.title = "Title is required.";
    }

    // Author
    const rawAuthor = values.author != null ? String(values.author) : "";
    if (rawAuthor.trim() === "") {
        errors.author = "Author is required.";
    }

    // Category
    const rawCategory = values.category != null ? String(values.category) : "";
    if (rawCategory.trim() === "") {
        errors.category = "Category is required.";
    }

    // ISBN
    const rawIsbn = values.ISBN != null ? String(values.ISBN) : (values.isbn != null ? String(values.isbn) : "");
    if (rawIsbn.trim() === "") {
        errors.ISBN = "ISBN is required.";
    } else {
        const norm = normalizeIsbn(rawIsbn);
        if (norm.length !== 10 && norm.length !== 13) {
            errors.ISBN = "ISBN must be 10 or 13 characters.";
        } else if (norm.length === 10) {
            if (!/^\d{9}[\dX]$/.test(norm)) {
                errors.ISBN = "ISBN-10 must contain 9 digits followed by a digit or X.";
            }
        } else if (norm.length === 13) {
            if (!/^\d{13}$/.test(norm)) {
                errors.ISBN = "ISBN-13 must contain 13 digits.";
            }
        }
    }

    // Total Copies
    const total = parseInteger(values.totalCopies);
    if (total === null || total < 0) {
        errors.totalCopies = "Total copies must be a whole number 0 or greater.";
    }

    // Available Copies
    if (values.availableCopies !== undefined && values.availableCopies !== null && String(values.availableCopies).trim() !== "") {
        const avail = parseInteger(values.availableCopies);
        if (avail === null || avail < 0) {
            errors.availableCopies = "Available copies must be a whole number 0 or greater.";
        } else if (total !== null && total >= 0 && avail > total) {
            errors.availableCopies = "Available copies cannot exceed total copies.";
        }
    }

    // Publication Year (optional)
    if (values.publicationYear !== undefined && values.publicationYear !== null && String(values.publicationYear).trim() !== "") {
        const yr = Number(String(values.publicationYear).trim());
        const currentYear = new Date().getFullYear();
        if (!Number.isInteger(yr) || yr < 1000 || yr > currentYear + 5) {
            errors.publicationYear = `Publication year must be between 1000 and ${currentYear + 5}.`;
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Transforms validated form values into an API request payload.
 * Trims strings, normalizes ISBN, parses copy counts.
 * Never throws.
 * @param {object} rawValues
 * @returns {object}
 */
export const toPayload = (rawValues) => {
    const values = rawValues && typeof rawValues === "object" ? rawValues : {};
    const title = typeof values.title === "string" ? values.title.trim() : (values.title != null ? String(values.title).trim() : "");
    const author = typeof values.author === "string" ? values.author.trim() : (values.author != null ? String(values.author).trim() : "");
    const ISBN = normalizeIsbn(values.ISBN != null ? values.ISBN : (values.isbn != null ? values.isbn : ""));
    const category = typeof values.category === "string" ? values.category.trim() : (values.category != null ? String(values.category).trim() : "");
    const publisher = typeof values.publisher === "string" ? values.publisher.trim() : (values.publisher != null ? String(values.publisher).trim() : "");
    const description = typeof values.description === "string" ? values.description.trim() : (values.description != null ? String(values.description).trim() : "");

    const total = parseInteger(values.totalCopies);
    const totalCopies = total !== null && total >= 0 ? total : 0;

    let availableCopies = totalCopies;
    if (values.availableCopies !== undefined && values.availableCopies !== null && String(values.availableCopies).trim() !== "") {
        const avail = parseInteger(values.availableCopies);
        if (avail !== null && avail >= 0) {
            availableCopies = Math.min(avail, totalCopies);
        }
    }

    let publicationYear = null;
    if (values.publicationYear !== undefined && values.publicationYear !== null && String(values.publicationYear).trim() !== "") {
        const yr = Number(String(values.publicationYear).trim());
        if (!Number.isNaN(yr) && Number.isInteger(yr)) {
            publicationYear = yr;
        }
    }

    const payload = {
        title,
        author,
        ISBN,
        category,
        totalCopies,
        availableCopies,
    };

    if (publisher) {
        payload.publisher = publisher;
    }
    if (publicationYear !== null) {
        payload.publicationYear = publicationYear;
    }
    if (description) {
        payload.description = description;
    }

    return payload;
};
