const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const readConfig = require("../src/config/env");
const createApp = require("../src/app");
const User = require("../src/models/userModel");

const env = {
    MONGO_URI: "mongodb://localhost/library",
    JWT_SECRET: "x".repeat(32),
    FRONTEND_URL: "http://localhost:5173"
};

test("User model toSafeObject excludes passwordHash and includes safe fields", () => {
    const user = new User({
        name: "Test User",
        email: "Test@Example.Com",
        passwordHash: "hashedsecret",
        role: "User"
    });

    assert.equal(user.email, "test@example.com"); // normalized lowercase
    const safe = user.toSafeObject();
    assert.equal(safe.name, "Test User");
    assert.equal(safe.email, "test@example.com");
    assert.equal(safe.role, "User");
    assert.equal(safe.passwordHash, undefined);
    assert.ok(safe.id);
});

test("User model validation rejects missing required fields", async () => {
    const emptyUser = new User({});
    const error = await emptyUser.validate().catch((err) => err);
    assert.ok(error.errors.name);
    assert.ok(error.errors.email);
    assert.ok(error.errors.passwordHash);
});

test("Auth API rejects invalid registration payloads with 400", async (t) => {
    const server = createApp(readConfig(env)).listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/api/auth/register`;

    // Missing name
    const res1 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com", password: "password123" })
    });
    assert.equal(res1.status, 400);
    const body1 = await res1.json();
    assert.equal(body1.error.message, "Name is required");

    // Missing email
    const res2 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User", password: "password123" })
    });
    assert.equal(res2.status, 400);
    const body2 = await res2.json();
    assert.equal(body2.error.message, "Email is required");

    // Invalid email format
    const res3 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User", email: "notanemail", password: "password123" })
    });
    assert.equal(res3.status, 400);
    const body3 = await res3.json();
    assert.equal(body3.error.message, "Enter a valid email address");

    // Short password
    const res4 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User", email: "user@test.com", password: "123" })
    });
    assert.equal(res4.status, 400);
    const body4 = await res4.json();
    assert.equal(body4.error.message, "Password must be at least 8 characters");
});

test("Auth API rejects invalid login payloads with 400", async (t) => {
    const server = createApp(readConfig(env)).listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/api/auth/login`;

    // Missing password
    const res1 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com" })
    });
    assert.equal(res1.status, 400);
    const body1 = await res1.json();
    assert.equal(body1.error.message, "Email and password are required");

    // Missing email
    const res2 = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "password123" })
    });
    assert.equal(res2.status, 400);
    const body2 = await res2.json();
    assert.equal(body2.error.message, "Email and password are required");
});

test("HTTP registration: hashes password, ignores client Admin role, returns expiring token without passwordHash", async (t) => {
    const origFindOne = User.findOne;
    const origCreate = User.create;
    t.after(() => {
        User.findOne = origFindOne;
        User.create = origCreate;
    });

    let createdUserArgs = null;
    User.findOne = async () => null;
    User.create = async (args) => {
        createdUserArgs = args;
        return new User({
            _id: "60d5ecb8b5c9c61234567890",
            ...args
        });
    };

    const server = createApp(readConfig(env)).listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/api/auth/register`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Harsh Surana",
            email: "Harsh@Example.Com",
            password: "superSecretPassword123",
            role: "Admin" // Attempted role escalation
        })
    });

    assert.equal(response.status, 201);
    const body = await response.json();

    // Verify database creation args
    assert.ok(createdUserArgs, "User.create was called");
    assert.equal(createdUserArgs.name, "Harsh Surana");
    assert.equal(createdUserArgs.email, "harsh@example.com");
    assert.equal(createdUserArgs.role, "User", "Client-supplied Admin role must be ignored");
    assert.notEqual(createdUserArgs.passwordHash, "superSecretPassword123", "Password must be hashed");
    assert.ok(bcrypt.compareSync("superSecretPassword123", createdUserArgs.passwordHash), "Password hash must match original password");

    // Verify response body
    assert.ok(body.data, "Response has data property");
    assert.equal(body.data.user.name, "Harsh Surana");
    assert.equal(body.data.user.email, "harsh@example.com");
    assert.equal(body.data.user.role, "User");
    assert.equal(body.data.user.passwordHash, undefined, "passwordHash must never be returned");

    // Verify token validity and claims
    assert.ok(body.data.token, "Token is returned");
    const decoded = jwt.verify(body.data.token, env.JWT_SECRET);
    assert.equal(decoded.id, "60d5ecb8b5c9c61234567890");
    assert.equal(decoded.email, "harsh@example.com");
    assert.equal(decoded.role, "User");
    assert.ok(decoded.exp > Math.floor(Date.now() / 1000), "Token must have future expiry");
});

test("HTTP registration: duplicate email returns 409 Conflict", async (t) => {
    const origFindOne = User.findOne;
    t.after(() => {
        User.findOne = origFindOne;
    });

    User.findOne = async () => new User({
        _id: "60d5ecb8b5c9c61234567890",
        name: "Existing",
        email: "existing@example.com",
        passwordHash: "hash",
        role: "User"
    });

    const server = createApp(readConfig(env)).listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/api/auth/register`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Existing User",
            email: "existing@example.com",
            password: "validPassword123"
        })
    });

    assert.equal(response.status, 409);
    const body = await response.json();
    assert.deepEqual(body, {
        error: { message: "Email is already registered" }
    });
});

test("HTTP registration: handles unique-index race condition (E11000) returning 409 Conflict", async (t) => {
    const origFindOne = User.findOne;
    const origCreate = User.create;
    t.after(() => {
        User.findOne = origFindOne;
        User.create = origCreate;
    });

    User.findOne = async () => null; // Passed existence check
    User.create = async () => {
        const error = new Error("E11000 duplicate key error collection");
        error.code = 11000;
        throw error;
    };

    const server = createApp(readConfig(env)).listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/api/auth/register`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Race Condition User",
            email: "race@example.com",
            password: "validPassword123"
        })
    });

    assert.equal(response.status, 409);
    const body = await response.json();
    assert.deepEqual(body, {
        error: { message: "Email is already registered" }
    });
});

test("HTTP login: accepts correct password, returns expiring token without passwordHash", async (t) => {
    const origFindOne = User.findOne;
    t.after(() => {
        User.findOne = origFindOne;
    });

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync("correctPassword123", salt);

    User.findOne = async () => new User({
        _id: "60d5ecb8b5c9c61234567890",
        name: "Login User",
        email: "login@example.com",
        passwordHash,
        role: "User"
    });

    const server = createApp(readConfig(env)).listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/api/auth/login`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: "login@example.com",
            password: "correctPassword123"
        })
    });

    assert.equal(response.status, 200);
    const body = await response.json();

    assert.ok(body.data, "Response has data property");
    assert.equal(body.data.user.email, "login@example.com");
    assert.equal(body.data.user.role, "User");
    assert.equal(body.data.user.passwordHash, undefined, "passwordHash must never be returned");

    // Verify token validity and claims
    assert.ok(body.data.token, "Token is returned");
    const decoded = jwt.verify(body.data.token, env.JWT_SECRET);
    assert.equal(decoded.id, "60d5ecb8b5c9c61234567890");
    assert.equal(decoded.email, "login@example.com");
    assert.equal(decoded.role, "User");
    assert.ok(decoded.exp > Math.floor(Date.now() / 1000), "Token must have future expiry");
});

test("HTTP login: rejects incorrect password and nonexistent user with 401 Unauthorized", async (t) => {
    const origFindOne = User.findOne;
    t.after(() => {
        User.findOne = origFindOne;
    });

    const passwordHash = bcrypt.hashSync("correctPassword123", 10);
    const existingUser = new User({
        _id: "60d5ecb8b5c9c61234567890",
        name: "Login User",
        email: "login@example.com",
        passwordHash,
        role: "User"
    });

    const server = createApp(readConfig(env)).listen(0);
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const url = `http://localhost:${server.address().port}/api/auth/login`;

    // 1. Incorrect password
    User.findOne = async () => existingUser;
    const resWrongPass = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: "login@example.com",
            password: "wrongPassword456"
        })
    });
    assert.equal(resWrongPass.status, 401);
    const bodyWrongPass = await resWrongPass.json();
    assert.deepEqual(bodyWrongPass, {
        error: { message: "Invalid email or password" }
    });

    // 2. Nonexistent user
    User.findOne = async () => null;
    const resNotFound = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: "unknown@example.com",
            password: "anyPassword123"
        })
    });
    assert.equal(resNotFound.status, 401);
    const bodyNotFound = await resNotFound.json();
    assert.deepEqual(bodyNotFound, {
        error: { message: "Invalid email or password" }
    });
});
