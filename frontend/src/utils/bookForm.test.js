import assert from "node:assert/strict";
import test, { describe, it } from "node:test";
import {
    bookToFormValues,
    emptyBookForm,
    normalizeIsbn,
    toPayload,
    validateBookForm,
} from "./bookForm.js";

describe("bookForm utilities", () => {
    describe("emptyBookForm & bookToFormValues", () => {
        it("returns clone of emptyBookForm on null, undefined or non-objects", () => {
            assert.deepEqual(bookToFormValues(null), { ...emptyBookForm });
            assert.deepEqual(bookToFormValues(undefined), { ...emptyBookForm });
            assert.deepEqual(bookToFormValues("invalid"), { ...emptyBookForm });
        });

        it("correctly maps book fields into form values", () => {
            const book = {
                title: "Refactoring",
                author: "Martin Fowler",
                ISBN: "978-0201485677",
                category: "Programming",
                publisher: "Addison-Wesley",
                publicationYear: 1999,
                totalCopies: 5,
                availableCopies: 3,
                description: "Improving design of existing code.",
            };
            const values = bookToFormValues(book);
            assert.equal(values.title, "Refactoring");
            assert.equal(values.author, "Martin Fowler");
            assert.equal(values.ISBN, "978-0201485677");
            assert.equal(values.category, "Programming");
            assert.equal(values.publisher, "Addison-Wesley");
            assert.equal(values.publicationYear, "1999");
            assert.equal(values.totalCopies, "5");
            assert.equal(values.availableCopies, "3");
            assert.equal(values.description, "Improving design of existing code.");
        });

        it("handles fallback field names such as total, available, and isbn", () => {
            const values = bookToFormValues({
                title: "Test",
                author: "Author",
                isbn: "1234567890",
                total: 2,
                available: 1,
            });
            assert.equal(values.ISBN, "1234567890");
            assert.equal(values.totalCopies, "2");
            assert.equal(values.availableCopies, "1");
        });
    });

    describe("validateBookForm - required fields and whitespace", () => {
        it("flags missing required fields on empty input", () => {
            const { valid, errors } = validateBookForm({});
            assert.equal(valid, false);
            assert.ok(errors.title);
            assert.ok(errors.author);
            assert.ok(errors.category);
            assert.ok(errors.ISBN);
            assert.ok(errors.totalCopies);
        });

        it("flags whitespace-only values as invalid", () => {
            const { valid, errors } = validateBookForm({
                title: "   ",
                author: "\t \n",
                category: "  ",
                ISBN: "   ",
                totalCopies: "   ",
            });
            assert.equal(valid, false);
            assert.ok(errors.title);
            assert.ok(errors.author);
            assert.ok(errors.category);
            assert.ok(errors.ISBN);
            assert.ok(errors.totalCopies);
        });

        it("passes when all required fields are valid", () => {
            const { valid, errors } = validateBookForm({
                title: "Clean Code",
                author: "Robert C. Martin",
                category: "Software Engineering",
                ISBN: "9780132350884",
                totalCopies: "5",
                availableCopies: "5",
            });
            assert.equal(valid, true);
            assert.deepEqual(errors, {});
        });
    });

    describe("validateBookForm - ISBN validation", () => {
        it("accepts ISBN with hyphens and spaces", () => {
            const hyphenated = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "978-0-13-235088-4",
                totalCopies: "1",
            });
            assert.equal(hyphenated.valid, true);

            const spaced = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "978 0 13 235088 4",
                totalCopies: "1",
            });
            assert.equal(spaced.valid, true);
        });

        it("accepts valid 10-digit ISBN and ISBN-10 ending in X", () => {
            const endingInDigit = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "0201485672",
                totalCopies: "1",
            });
            assert.equal(endingInDigit.valid, true);

            const endingInX = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "0-486-65088-X",
                totalCopies: "1",
            });
            assert.equal(endingInX.valid, true);

            const lowercaseX = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "048665088x",
                totalCopies: "1",
            });
            assert.equal(lowercaseX.valid, true);
        });

        it("rejects bad lengths", () => {
            const tooShort = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "123456789",
                totalCopies: "1",
            });
            assert.equal(tooShort.valid, false);
            assert.ok(tooShort.errors.ISBN);

            const tooLong = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "97801323508841",
                totalCopies: "1",
            });
            assert.equal(tooLong.valid, false);
            assert.ok(tooLong.errors.ISBN);
        });

        it("rejects bad characters in ISBN", () => {
            const badChars10 = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "048665088A",
                totalCopies: "1",
            });
            assert.equal(badChars10.valid, false);
            assert.ok(badChars10.errors.ISBN);

            const badXPosition = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "04866508X0",
                totalCopies: "1",
            });
            assert.equal(badXPosition.valid, false);
            assert.ok(badXPosition.errors.ISBN);

            const badChars13 = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "978013235088X",
                totalCopies: "1",
            });
            assert.equal(badChars13.valid, false);
            assert.ok(badChars13.errors.ISBN);
        });
    });

    describe("validateBookForm - copies count validation", () => {
        it("rejects negative copies", () => {
            const result = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: -3,
            });
            assert.equal(result.valid, false);
            assert.ok(result.errors.totalCopies);
        });

        it("rejects decimal copies", () => {
            const result = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: "3.5",
            });
            assert.equal(result.valid, false);
            assert.ok(result.errors.totalCopies);
        });

        it("rejects NaN and non-numeric string copies", () => {
            const nanResult = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: NaN,
            });
            assert.equal(nanResult.valid, false);
            assert.ok(nanResult.errors.totalCopies);

            const stringResult = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: "five",
            });
            assert.equal(stringResult.valid, false);
            assert.ok(stringResult.errors.totalCopies);
        });

        it("rejects available copies > total copies", () => {
            const result = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: 4,
                availableCopies: 5,
            });
            assert.equal(result.valid, false);
            assert.ok(result.errors.availableCopies);
        });

        it("accepts available copies <= total copies and 0 copies", () => {
            const zeroCopies = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: 0,
                availableCopies: 0,
            });
            assert.equal(zeroCopies.valid, true);

            const validCopies = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: "10",
                availableCopies: "4",
            });
            assert.equal(validCopies.valid, true);
        });
    });

    describe("validateBookForm - publication year", () => {
        it("accepts a sane publication year and ignores empty year", () => {
            const withYear = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: 1,
                publicationYear: "2020",
            });
            assert.equal(withYear.valid, true);

            const emptyYear = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: 1,
                publicationYear: "",
            });
            assert.equal(emptyYear.valid, true);
        });

        it("rejects years outside sane range or malformed years", () => {
            const tooOld = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: 1,
                publicationYear: 500,
            });
            assert.equal(tooOld.valid, false);
            assert.ok(tooOld.errors.publicationYear);

            const tooFarFuture = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: 1,
                publicationYear: 3000,
            });
            assert.equal(tooFarFuture.valid, false);
            assert.ok(tooFarFuture.errors.publicationYear);

            const notAnInt = validateBookForm({
                title: "Book",
                author: "Author",
                category: "Category",
                ISBN: "9780132350884",
                totalCopies: 1,
                publicationYear: "twenty-twenty",
            });
            assert.equal(notAnInt.valid, false);
            assert.ok(notAnInt.errors.publicationYear);
        });
    });

    describe("toPayload normalization", () => {
        it("normalizes strings, trims whitespace, and formats ISBN", () => {
            const payload = toPayload({
                title: "  Design Patterns  ",
                author: "  Gang of Four  ",
                ISBN: "  978-0-201-63361-0  ",
                category: "  Software  ",
                publisher: "  Addison-Wesley  ",
                publicationYear: "1994",
                totalCopies: "5",
                availableCopies: "3",
                description: "  Elements of Reusable Object-Oriented Software.  ",
            });

            assert.deepEqual(payload, {
                title: "Design Patterns",
                author: "Gang of Four",
                ISBN: "9780201633610",
                category: "Software",
                publisher: "Addison-Wesley",
                publicationYear: 1994,
                totalCopies: 5,
                availableCopies: 3,
                description: "Elements of Reusable Object-Oriented Software.",
            });
        });

        it("normalizes ISBN-10 with lowercase x to uppercase X", () => {
            const payload = toPayload({
                title: "Book",
                author: "Author",
                ISBN: "0-486-65088-x",
                totalCopies: 1,
            });
            assert.equal(payload.ISBN, "048665088X");
        });

        it("clamps availableCopies to totalCopies if exceeded in payload input", () => {
            const payload = toPayload({
                title: "Book",
                author: "Author",
                totalCopies: 3,
                availableCopies: 10,
            });
            assert.equal(payload.totalCopies, 3);
            assert.equal(payload.availableCopies, 3);
        });

        it("handles null or missing inputs safely without throwing", () => {
            const payload = toPayload(null);
            assert.equal(payload.title, "");
            assert.equal(payload.author, "");
            assert.equal(payload.totalCopies, 0);
            assert.equal(payload.availableCopies, 0);
        });
    });
});
