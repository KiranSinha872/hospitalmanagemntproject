const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

const createApp = (config) => {
    const app = express();

    app.locals.config = config;

    app.disable("x-powered-by");
    app.use(cors({ origin: config.frontendUrl }));
    app.use(express.json({ limit: "100kb" }));

    app.use("/api/health", healthRoutes);
    app.use("/api/auth", authRoutes);

    app.use((req, res) => {
        res.status(404).json({
            error: { message: "Route not found" }
        });
    });

    app.use(errorHandler);

    return app;
};

module.exports = createApp;
