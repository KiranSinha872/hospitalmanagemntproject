const toNonNegativeInt = (val) => {
    if (typeof val === "number") {
        if (!Number.isFinite(val) || Number.isNaN(val)) return 0;
        return Math.max(0, Math.floor(val));
    }
    if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "") return 0;
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return 0;
        return Math.max(0, Math.floor(parsed));
    }
    return 0;
};

/**
 * Calculate book inventory availability.
 * @param {object} book
 * @returns {{ total: number, available: number, label: ("Available" | "All copies out" | "Unavailable") }}
 */
export const getAvailability = (book) => {
    if (!book || typeof book !== "object") {
        return { total: 0, available: 0, label: "Unavailable" };
    }

    const rawTotal = book.totalCopies !== undefined ? book.totalCopies : book.total;
    const rawAvailable = book.availableCopies !== undefined ? book.availableCopies : book.available;

    const total = toNonNegativeInt(rawTotal);
    let available = toNonNegativeInt(rawAvailable);

    if (available > total) {
        available = total;
    }

    let label = "Unavailable";
    if (total > 0) {
        if (available > 0) {
            label = "Available";
        } else {
            label = "All copies out";
        }
    }

    return { total, available, label };
};

/**
 * Normalize raw book data safely without throwing on missing or unexpected values.
 * @param {object} raw
 * @returns {object}
 */
export const normalizeBook = (raw) => {
    if (!raw || typeof raw !== "object") {
        return {
            id: "",
            _id: "",
            title: "Untitled",
            author: "Unknown author",
            ISBN: "",
            isbn: "",
            category: "Uncategorized",
            description: "",
            publisher: "",
            publicationYear: null,
            totalCopies: 0,
            availableCopies: 0,
            availability: { total: 0, available: 0, label: "Unavailable" },
        };
    }

    const id = raw._id != null ? String(raw._id) : (raw.id != null ? String(raw.id) : "");
    const title = typeof raw.title === "string" && raw.title.trim() !== ""
        ? raw.title.trim()
        : (raw.title != null && typeof raw.title !== "object" ? String(raw.title).trim() : "Untitled");
    const author = typeof raw.author === "string" && raw.author.trim() !== ""
        ? raw.author.trim()
        : (raw.author != null && typeof raw.author !== "object" ? String(raw.author).trim() : "Unknown author");

    const rawIsbn = raw.ISBN !== undefined ? raw.ISBN : raw.isbn;
    const isbn = typeof rawIsbn === "string"
        ? rawIsbn.trim()
        : (rawIsbn != null && typeof rawIsbn !== "object" ? String(rawIsbn).trim() : "");

    const category = typeof raw.category === "string" && raw.category.trim() !== ""
        ? raw.category.trim()
        : (raw.category != null && typeof raw.category !== "object" ? String(raw.category).trim() : "Uncategorized");

    const description = typeof raw.description === "string"
        ? raw.description.trim()
        : (raw.description != null && typeof raw.description !== "object" ? String(raw.description).trim() : "");

    const publisher = typeof raw.publisher === "string"
        ? raw.publisher.trim()
        : (raw.publisher != null && typeof raw.publisher !== "object" ? String(raw.publisher).trim() : "");

    let publicationYear = null;
    if (raw.publicationYear != null && raw.publicationYear !== "") {
        const yr = Number(raw.publicationYear);
        if (Number.isFinite(yr)) {
            publicationYear = Math.floor(yr);
        }
    }

    const availability = getAvailability(raw);

    return {
        id,
        _id: id,
        title,
        author,
        ISBN: isbn,
        isbn,
        category,
        description,
        publisher,
        publicationYear,
        totalCopies: availability.total,
        availableCopies: availability.available,
        availability,
    };
};
