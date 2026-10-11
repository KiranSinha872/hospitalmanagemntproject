const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { authenticateUser, requireAdmin } = require("../src/middleware/authMiddleware");
const bootstrapAdmin = require("../src/scripts/bootstrapAdmin");
const User = require("../src/models/userModel");

const secret = "x".repeat(32);

const createTestApp = () => {
    const app = express();
    app.locals.config = { jwtSecret: secret };

    app.get("/public", (req, res) => res.json({ data: "public" }));

    app.get("/protected", authenticateUser, (req, res) => {
        res.json({ data: { user: req.user } });
    });

    app.get("/admin-only", authenticateUser, requireAdmin, (req, res) => {
        res.json({ data: { message: "admin-granted", user: req.user } });
    });

    return app;
};

test("authenticateUser rejects missing, non-Bearer, and empty tokens with 401", async (t) => {
    const app = createTestApp();
    const server = app.listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/protected`;

    // 1. Missing Authorization header
    const resNoHeader = await fetch(url);
    assert.equal(resNoHeader.status, 401);
    assert.deepEqual(await resNoHeader.json(), {
        error: { message: "Authentication required" }
    });

    // 2. Non-Bearer token (Basic auth format)
    const resBasic = await fetch(url, {
        headers: { Authorization: "Basic dXNlcjpwYXNz" }
    });
    assert.equal(resBasic.status, 401);
    assert.deepEqual(await resBasic.json(), {
        error: { message: "Authentication required" }
    });

    // 3. Bearer with whitespace only
    const resEmpty = await fetch(url, {
        headers: { Authorization: "Bearer    " }
    });
    assert.equal(resEmpty.status, 401);
    assert.deepEqual(await resEmpty.json(), {
        error: { message: "Authentication required" }
    });
});

test("authenticateUser rejects expired, forged, and malformed tokens with 401", async (t) => {
    const app = createTestApp();
    const server = app.listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/protected`;

    // 1. Expired token
    const expiredToken = jwt.sign(
        { id: "123", email: "user@test.com", role: "User" },
        secret,
        { expiresIn: "-1s" }
    );
    const resExpired = await fetch(url, {
        headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.equal(resExpired.status, 401);
    assert.deepEqual(await resExpired.json(), {
        error: { message: "Invalid or expired token" }
    });

    // 2. Forged token (signed with different secret)
    const forgedToken = jwt.sign(
        { id: "123", email: "user@test.com", role: "Admin" },
        "wrong-secret-key-that-does-not-match32"
    );
    const resForged = await fetch(url, {
        headers: { Authorization: `Bearer ${forgedToken}` }
    });
    assert.equal(resForged.status, 401);
    assert.deepEqual(await resForged.json(), {
        error: { message: "Invalid or expired token" }
    });

    // 3. Malformed token string
    const resMalformed = await fetch(url, {
        headers: { Authorization: "Bearer not.a.valid.jwt" }
    });
    assert.equal(resMalformed.status, 401);
    assert.deepEqual(await resMalformed.json(), {
        error: { message: "Invalid or expired token" }
    });
});

test("authenticateUser attaches req.user and passes valid requests", async (t) => {
    const app = createTestApp();
    const server = app.listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const validToken = jwt.sign(
        { id: "user_abc123", email: "student@library.org", role: "User" },
        secret,
        { expiresIn: "1h" }
    );

    const url = `http://localhost:${server.address().port}/protected`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${validToken}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.data.user, {
        id: "user_abc123",
        email: "student@library.org",
        role: "User"
    });
});

test("requireAdmin grants Admin role and denies User role with 403", async (t) => {
    const app = createTestApp();
    const server = app.listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/admin-only`;

    // 1. Regular User attempt -> 403 Forbidden
    const userToken = jwt.sign(
        { id: "user_1", email: "user@library.org", role: "User" },
        secret,
        { expiresIn: "1h" }
    );
    const resUser = await fetch(url, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(resUser.status, 403);
    assert.deepEqual(await resUser.json(), {
        error: { message: "Admin access required" }
    });

    // 2. Admin access -> 200 OK
    const adminToken = jwt.sign(
        { id: "admin_1", email: "admin@library.org", role: "Admin" },
        secret,
        { expiresIn: "1h" }
    );
    const resAdmin = await fetch(url, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resAdmin.status, 200);
    const bodyAdmin = await resAdmin.json();
    assert.equal(bodyAdmin.data.message, "admin-granted");
    assert.equal(bodyAdmin.data.user.role, "Admin");
});

test("bootstrapAdmin validates arguments and provisions Admin safely", async (t) => {
    // 1. Argument validations
    await assert.rejects(
        () => bootstrapAdmin({ name: "", email: "a@b.com", password: "password123" }),
        /Name is required/
    );
    await assert.rejects(
        () => bootstrapAdmin({ name: "Admin", email: "invalid-email", password: "password123" }),
        /Enter a valid email address/
    );
    await assert.rejects(
        () => bootstrapAdmin({ name: "Admin", email: "a@b.com", password: "short" }),
        /Password must be at least 8 characters/
    );

    // 2. Mock creation of new Admin
    const origFindOne = User.findOne;
    const origCreate = User.create;
    t.after(() => {
        User.findOne = origFindOne;
        User.create = origCreate;
    });

    let createdRecord = null;
    User.findOne = async () => null;
    User.create = async (args) => {
        createdRecord = args;
        return new User({
            _id: "60d5ecb8b5c9c61234567899",
            ...args
        });
    };

    const result = await bootstrapAdmin({
        name: "Head Librarian",
        email: "Librarian@Library.Org",
        password: "secureAdminPassword123"
    });

    assert.equal(result.action, "created");
    assert.equal(result.user.name, "Head Librarian");
    assert.equal(result.user.email, "librarian@library.org");
    assert.equal(result.user.role, "Admin");
    assert.equal(result.user.passwordHash, undefined, "passwordHash must not be exposed");

    assert.ok(createdRecord);
    assert.equal(createdRecord.role, "Admin");
    assert.ok(bcrypt.compareSync("secureAdminPassword123", createdRecord.passwordHash));
});

test("bootstrapAdmin promotes existing User to Admin", async (t) => {
    const origFindOne = User.findOne;
    t.after(() => {
        User.findOne = origFindOne;
    });

    const existingUser = new User({
        _id: "60d5ecb8b5c9c61234567898",
        name: "Staff Member",
        email: "staff@library.org",
        passwordHash: "oldhash",
        role: "User"
    });
    existingUser.save = async () => existingUser;

    User.findOne = async () => existingUser;

    const result = await bootstrapAdmin({
        name: "Staff Member",
        email: "staff@library.org",
        password: "newAdminPassword123"
    });

    assert.equal(result.action, "promoted");
    assert.equal(result.user.role, "Admin");
    assert.equal(existingUser.role, "Admin");
    assert.ok(bcrypt.compareSync("newAdminPassword123", existingUser.passwordHash));
});
