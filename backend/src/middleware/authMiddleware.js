const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string") {
        return res.status(401).json({
            error: { message: "Authentication required" }
        });
    }

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: { message: "Authentication required" }
        });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        return res.status(401).json({
            error: { message: "Authentication required" }
        });
    }

    const jwtSecret = req.app?.locals?.config?.jwtSecret || process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(500).json({
            error: { message: "Server authentication configuration missing" }
        });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded || !decoded.id || !decoded.role) {
            return res.status(401).json({
                error: { message: "Invalid or expired token" }
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        return next();
    } catch (err) {
        return res.status(401).json({
            error: { message: "Invalid or expired token" }
        });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({
            error: { message: "Admin access required" }
        });
    }

    return next();
};

module.exports = {
    authenticateUser,
    requireAdmin
};
