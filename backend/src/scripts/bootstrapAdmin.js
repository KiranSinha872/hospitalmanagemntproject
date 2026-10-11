require("dotenv/config");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

const MIN_PASSWORD_LENGTH = 8;

const bootstrapAdmin = async ({ name, email, password, mongoUri }) => {
    if (!name || typeof name !== "string" || !name.trim()) {
        throw new Error("Name is required");
    }

    if (!email || typeof email !== "string" || !email.trim()) {
        throw new Error("Email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        throw new Error("Enter a valid email address");
    }

    if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const shouldConnect = Boolean(mongoUri) && mongoose.connection.readyState !== 1;
    if (shouldConnect) {
        await mongoose.connect(mongoUri);
    }

    try {
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            existingUser.role = "Admin";
            if (name.trim()) {
                existingUser.name = name.trim();
            }
            existingUser.passwordHash = await bcrypt.hash(password, 10);
            await existingUser.save();
            return {
                action: "promoted",
                user: existingUser.toSafeObject()
            };
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: "Admin"
        });

        return {
            action: "created",
            user: user.toSafeObject()
        };
    } finally {
        if (shouldConnect) {
            await mongoose.disconnect();
        }
    }
};

const runFromCli = async () => {
    const name = process.env.ADMIN_NAME || "Administrator";
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const mongoUri = process.env.MONGO_URI;

    if (!email || !password) {
        console.error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
        process.exit(1);
    }

    try {
        const result = await bootstrapAdmin({ name, email, password, mongoUri });
        console.log(`Admin account ${result.action} successfully for ${result.user.email}`);
        process.exit(0);
    } catch (err) {
        console.error(`Bootstrap failed: ${err.message}`);
        process.exit(1);
    }
};

if (require.main === module) {
    runFromCli();
}

module.exports = bootstrapAdmin;
