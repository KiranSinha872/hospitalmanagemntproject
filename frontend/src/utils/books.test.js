import assert from "node:assert/strict";
import test, { describe, it } from "node:test";
import { getAvailability, normalizeBook } from "./books.js";

describe("getAvailability", () => {
    it("handles null, undefined and non-object inputs gracefully", () => {
        assert.deepEqual(getAvailability(null), { total: 0, available: 0, label: "Unavailable" });
        assert.deepEqual(getAvailability(undefined), { total: 0, available: 0, label: "Unavailable" });
        assert.deepEqual(getAvailability("not an object"), { total: 0, available: 0, label: "Unavailable" });
        assert.deepEqual(getAvailability(123), { total: 0, available: 0, label: "Unavailable" });
    });

    it("handles missing fields in plain object", () => {
        assert.deepEqual(getAvailability({}), { total: 0, available: 0, label: "Unavailable" });
    });

    it("parses valid numbers correctly", () => {
        assert.deepEqual(getAvailability({ totalCopies: 10, availableCopies: 5 }), {
            total: 10,
            available: 5,
            label: "Available",
        });
    });

    it("supports fallback total and available property names", () => {
        assert.deepEqual(getAvailability({ total: 6, available: 2 }), {
            total: 6,
            available: 2,
            label: "Available",
        });
    });

    it("handles numeric strings", () => {
        assert.deepEqual(getAvailability({ totalCopies: "8", availableCopies: "3" }), {
            total: 8,
            available: 3,
            label: "Available",
        });
    });

    it("clamps negative numbers to 0 and returns Unavailable", () => {
        assert.deepEqual(getAvailability({ totalCopies: -5, availableCopies: -2 }), {
            total: 0,
            available: 0,
            label: "Unavailable",
        });
    });

    it("clamps available copies when available > total", () => {
        const result = getAvailability({ totalCopies: 4, availableCopies: 9 });
        assert.equal(result.total, 4);
        assert.equal(result.available, 4);
        assert.equal(result.label, "Available");
    });

    it("handles NaN, Infinity and non-numeric strings safely", () => {
        assert.deepEqual(getAvailability({ totalCopies: NaN, availableCopies: NaN }), {
            total: 0,
            available: 0,
            label: "Unavailable",
        });
        assert.deepEqual(getAvailability({ totalCopies: Infinity, availableCopies: -Infinity }), {
            total: 0,
            available: 0,
            label: "Unavailable",
        });
        assert.deepEqual(getAvailability({ totalCopies: "abc", availableCopies: "xyz" }), {
            total: 0,
            available: 0,
            label: "Unavailable",
        });
    });

    it("handles wrong types such as booleans, arrays and objects", () => {
        assert.deepEqual(getAvailability({ totalCopies: true, availableCopies: [1] }), {
            total: 0,
            available: 0,
            label: "Unavailable",
        });
        assert.deepEqual(getAvailability({ totalCopies: {}, availableCopies: null }), {
            total: 0,
            available: 0,
            label: "Unavailable",
        });
    });

    it("returns 'All copies out' when total > 0 and available === 0", () => {
        assert.deepEqual(getAvailability({ totalCopies: 5, availableCopies: 0 }), {
            total: 5,
            available: 0,
            label: "All copies out",
        });
        assert.deepEqual(getAvailability({ totalCopies: "3", availableCopies: "0" }), {
            total: 3,
            available: 0,
            label: "All copies out",
        });
    });

    it("returns 'Unavailable' when total === 0", () => {
        assert.deepEqual(getAvailability({ totalCopies: 0, availableCopies: 0 }), {
            total: 0,
            available: 0,
            label: "Unavailable",
        });
    });
});

describe("normalizeBook", () => {
    it("handles null, undefined and non-objects without throwing", () => {
        const resultNull = normalizeBook(null);
        assert.equal(resultNull.title, "Untitled");
        assert.equal(resultNull.author, "Unknown author");
        assert.equal(resultNull.totalCopies, 0);
        assert.equal(resultNull.availableCopies, 0);
        assert.equal(resultNull.availability.label, "Unavailable");

        const resultStr = normalizeBook("hello");
        assert.equal(resultStr.title, "Untitled");
        assert.equal(resultStr.author, "Unknown author");
    });

    it("handles an empty object with safe defaults", () => {
        const book = normalizeBook({});
        assert.equal(book.id, "");
        assert.equal(book._id, "");
        assert.equal(book.title, "Untitled");
        assert.equal(book.author, "Unknown author");
        assert.equal(book.ISBN, "");
        assert.equal(book.isbn, "");
        assert.equal(book.category, "Uncategorized");
        assert.equal(book.description, "");
        assert.equal(book.publisher, "");
        assert.equal(book.publicationYear, null);
        assert.equal(book.totalCopies, 0);
        assert.equal(book.availableCopies, 0);
        assert.equal(book.availability.label, "Unavailable");
    });

    it("preserves valid fields and normalizes _id / id", () => {
        const raw = {
            _id: "book-123",
            title: "Clean Code",
            author: "Robert C. Martin",
            ISBN: "978-0132350884",
            category: "Software",
            description: "A handbook of agile software craftsmanship.",
            publisher: "Prentice Hall",
            publicationYear: 2008,
            totalCopies: 5,
            availableCopies: 3,
        };
        const book = normalizeBook(raw);
        assert.equal(book.id, "book-123");
        assert.equal(book._id, "book-123");
        assert.equal(book.title, "Clean Code");
        assert.equal(book.author, "Robert C. Martin");
        assert.equal(book.ISBN, "978-0132350884");
        assert.equal(book.category, "Software");
        assert.equal(book.description, "A handbook of agile software craftsmanship.");
        assert.equal(book.publisher, "Prentice Hall");
        assert.equal(book.publicationYear, 2008);
        assert.equal(book.totalCopies, 5);
        assert.equal(book.availableCopies, 3);
        assert.equal(book.availability.label, "Available");
    });

    it("handles wrong types for title, author, and category safely", () => {
        const raw = {
            title: 12345,
            author: true,
            ISBN: null,
            category: 99,
        };
        const book = normalizeBook(raw);
        assert.equal(typeof book.title, "string");
        assert.equal(typeof book.author, "string");
        assert.equal(typeof book.ISBN, "string");
        assert.equal(typeof book.category, "string");
    });

    it("handles numeric strings for totalCopies and availableCopies", () => {
        const book = normalizeBook({
            title: "Refactoring",
            totalCopies: "10",
            availableCopies: "4",
        });
        assert.equal(book.totalCopies, 10);
        assert.equal(book.availableCopies, 4);
        assert.equal(book.availability.label, "Available");
    });

    it("handles availableCopies > totalCopies properly", () => {
        const book = normalizeBook({
            title: "Test Book",
            totalCopies: 2,
            availableCopies: 5,
        });
        assert.equal(book.totalCopies, 2);
        assert.equal(book.availableCopies, 2);
        assert.equal(book.availability.label, "Available");
    });

    it("handles negative numbers and NaN for copies", () => {
        const book = normalizeBook({
            totalCopies: -3,
            availableCopies: NaN,
        });
        assert.equal(book.totalCopies, 0);
        assert.equal(book.availableCopies, 0);
        assert.equal(book.availability.label, "Unavailable");
    });
});
