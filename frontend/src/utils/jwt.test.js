import assert from "node:assert/strict";
import test, { describe, it } from "node:test";
import { decodeJwtPayload, isTokenExpired, parseStoredSession } from "./jwt.js";

const toBase64Url = (str) =>
    Buffer.from(str)
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

const makeToken = (payload, header = { alg: "HS256", typ: "JWT" }) => {
    const h = toBase64Url(JSON.stringify(header));
    const p = typeof payload === "string" ? payload : toBase64Url(JSON.stringify(payload));
    return `${h}.${p}.signature`;
};

describe("decodeJwtPayload", () => {
    it("accepts a valid token with a plain object payload", () => {
        const token = makeToken({ sub: "user-1", role: "User", exp: 1700000000 });
        const decoded = decodeJwtPayload(token);
        assert.deepEqual(decoded, { sub: "user-1", role: "User", exp: 1700000000 });
    });

    it("rejects non-string and malformed token formats: 'x', '', null, undefined, 123, 'a.b', 'a.b.c.d'", () => {
        assert.equal(decodeJwtPayload("x"), null);
        assert.equal(decodeJwtPayload(""), null);
        assert.equal(decodeJwtPayload(null), null);
        assert.equal(decodeJwtPayload(undefined), null);
        assert.equal(decodeJwtPayload(123), null);
        assert.equal(decodeJwtPayload("a.b"), null);
        assert.equal(decodeJwtPayload("a.b.c.d"), null);
        assert.equal(decodeJwtPayload(".."), null);
        assert.equal(decodeJwtPayload("a..c"), null);
    });

    it("rejects token with invalid base64 payload", () => {
        assert.equal(decodeJwtPayload("header.%%%invalid_base64%%%.sig"), null);
    });

    it("rejects token with valid base64 but non-JSON payload", () => {
        const notJsonBase64 = toBase64Url("this is plain text, not json");
        assert.equal(decodeJwtPayload(`header.${notJsonBase64}.sig`), null);
    });

    it("rejects JSON payload that is null, an array, a string or a number", () => {
        assert.equal(decodeJwtPayload(`header.${toBase64Url("null")}.sig`), null);
        assert.equal(decodeJwtPayload(`header.${toBase64Url("[1, 2, 3]")}.sig`), null);
        assert.equal(decodeJwtPayload(`header.${toBase64Url('"hello world"')}.sig`), null);
        assert.equal(decodeJwtPayload(`header.${toBase64Url("42")}.sig`), null);
    });
});

describe("isTokenExpired", () => {
    const nowMs = 1700000000000;
    const nowSec = 1700000000;

    it("accepts a token with a valid future exp", () => {
        const token = makeToken({ exp: nowSec + 3600 });
        assert.equal(isTokenExpired(token, nowMs), false);
    });

    it("rejects a token with a past exp", () => {
        const token = makeToken({ exp: nowSec - 60 });
        assert.equal(isTokenExpired(token, nowMs), true);
    });

    it("rejects a token with exp equal to now", () => {
        const token = makeToken({ exp: nowSec });
        assert.equal(isTokenExpired(token, nowMs), true);
    });

    it("rejects a token without an exp claim", () => {
        const token = makeToken({ sub: "user-123" });
        assert.equal(isTokenExpired(token, nowMs), true);
    });

    it("rejects exp as string, null, NaN, Infinity, negative", () => {
        assert.equal(isTokenExpired(makeToken({ exp: String(nowSec + 1000) }), nowMs), true);
        assert.equal(isTokenExpired(makeToken({ exp: null }), nowMs), true);
        assert.equal(isTokenExpired(makeToken({ exp: NaN }), nowMs), true);
        assert.equal(isTokenExpired(makeToken({ exp: Infinity }), nowMs), true);
        assert.equal(isTokenExpired(makeToken({ exp: -Infinity }), nowMs), true);
        assert.equal(isTokenExpired(makeToken({ exp: -50 }), nowMs), true);
    });

    it("rejects invalid/malformed tokens as expired", () => {
        assert.equal(isTokenExpired("invalid.token"), true);
        assert.equal(isTokenExpired(""), true);
        assert.equal(isTokenExpired(null), true);
        assert.equal(isTokenExpired(undefined), true);
    });
});

describe("parseStoredSession", () => {
    const nowMs = 1700000000000;
    const validToken = makeToken({ sub: "user-1", exp: 1700000000 + 3600 });
    const expiredToken = makeToken({ sub: "user-1", exp: 1700000000 - 3600 });
    const validUser = { _id: "u1", name: "Alice", email: "alice@example.com", role: "User" };

    it("returns { token, user } when session has valid token and non-null user object", () => {
        const raw = JSON.stringify({ token: validToken, user: validUser });
        const session = parseStoredSession(raw, nowMs);
        assert.deepEqual(session, { token: validToken, user: validUser });
    });

    it("returns null for corrupted stored JSON", () => {
        assert.equal(parseStoredSession("{corrupt-json", nowMs), null);
        assert.equal(parseStoredSession("", nowMs), null);
        assert.equal(parseStoredSession(null, nowMs), null);
        assert.equal(parseStoredSession(undefined, nowMs), null);
    });

    it("returns null for missing or empty token", () => {
        assert.equal(parseStoredSession(JSON.stringify({ user: validUser }), nowMs), null);
        assert.equal(parseStoredSession(JSON.stringify({ token: "", user: validUser }), nowMs), null);
        assert.equal(parseStoredSession(JSON.stringify({ token: 12345, user: validUser }), nowMs), null);
    });

    it("returns null for missing user, user as a string, null, or array", () => {
        assert.equal(parseStoredSession(JSON.stringify({ token: validToken }), nowMs), null);
        assert.equal(parseStoredSession(JSON.stringify({ token: validToken, user: "alice" }), nowMs), null);
        assert.equal(parseStoredSession(JSON.stringify({ token: validToken, user: null }), nowMs), null);
        assert.equal(parseStoredSession(JSON.stringify({ token: validToken, user: ["alice"] }), nowMs), null);
    });

    it("returns null if the token is expired or malformed", () => {
        assert.equal(parseStoredSession(JSON.stringify({ token: expiredToken, user: validUser }), nowMs), null);
        assert.equal(parseStoredSession(JSON.stringify({ token: "malformed.jwt", user: validUser }), nowMs), null);
    });
});
