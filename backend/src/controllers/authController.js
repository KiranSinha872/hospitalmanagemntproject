const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const MIN_PASSWORD_LENGTH = 8;

const authController = {
    register: async (req, res, next) => {
        try {
            const { name, email, password } = req.body;

            if (!name || typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    error: { message: "Name is required" }
                });
            }

            if (!email || typeof email !== "string" || !email.trim()) {
                return res.status(400).json({
                    error: { message: "Email is required" }
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    error: { message: "Enter a valid email address" }
                });
            }

            if (!password || typeof password !== "string") {
                return res.status(400).json({
                    error: { message: "Password is required" }
                });
            }

            if (password.length < MIN_PASSWORD_LENGTH) {
                return res.status(400).json({
                    error: { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Check if user already exists
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(409).json({
                    error: { message: "Email is already registered" }
                });
            }

            // Hash password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Always create with role: "User", rejecting client-supplied role escalation
            const user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                passwordHash,
                role: "User"
            });

            const jwtSecret = req.app?.locals?.config?.jwtSecret || process.env.JWT_SECRET;
            const token = jwt.sign(
                { id: user._id.toString(), email: user.email, role: user.role },
                jwtSecret,
                { expiresIn: "7d" }
            );

            return res.status(201).json({
                data: {
                    token,
                    user: user.toSafeObject()
                }
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({
                    error: { message: "Email is already registered" }
                });
            }
            return next(err);
        }
    },

    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || typeof email !== "string" || !email.trim() || !password || typeof password !== "string") {
                return res.status(400).json({
                    error: { message: "Email and password are required" }
                });
            }

            const normalizedEmail = email.trim().toLowerCase();
            const user = await User.findOne({ email: normalizedEmail });

            if (!user) {
                return res.status(401).json({
                    error: { message: "Invalid email or password" }
                });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return res.status(401).json({
                    error: { message: "Invalid email or password" }
                });
            }

            const jwtSecret = req.app?.locals?.config?.jwtSecret || process.env.JWT_SECRET;
            const token = jwt.sign(
                { id: user._id.toString(), email: user.email, role: user.role },
                jwtSecret,
                { expiresIn: "7d" }
            );

            return res.status(200).json({
                data: {
                    token,
                    user: user.toSafeObject()
                }
            });
        } catch (err) {
            return next(err);
        }
    }
};

module.exports = authController;
