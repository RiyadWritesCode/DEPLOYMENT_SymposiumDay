require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();

const logDirectory = "/var/log";
// Ensure the directory exists, create it if it doesn't
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const extensiveLogDirectory = "/var/extensiveLog";
// Ensure the directory exists, create it if it doesn't
if (!fs.existsSync(extensiveLogDirectory)) {
  fs.mkdirSync(extensiveLogDirectory, { recursive: true });
}

// Set up rotating logs
const accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: logDirectory,
});

// Set up rotating logs
const accessExtensiveLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: extensiveLogDirectory,
});

// Custom Morgan token to log user email
morgan.token("user-email", function (req) {
  return req.user ? req.user.email : "guest";
});

morgan.token("user", function (req) {
  return req.user ? JSON.stringify(req.user) : "no req.user";
});

morgan.token("req-body", function (req) {
  return req.body ? JSON.stringify(req.body) : "no req.body";
});

morgan.token("req-headers-authorization", function (req) {
  return req.headers ? JSON.stringify(req.headers.authorization) : "no req.headers.authorization";
});

// Custom Morgan token to log user email
morgan.token("req-params", function (req) {
  return req.params ? JSON.stringify(req.params) : "no req.params";
});

const logFormat =
  '[:date[web]] - :remote-addr - :user-email - ":method :url HTTP/:http-version" - :status - :response-time ms - :res[content-length] - ":referrer" - ":user-agent"';
app.use(morgan(logFormat, { stream: accessLogStream }));

const extensiveLogFormat =
  '[:date[web]] - :remote-addr - ":method :url" - :status - :response-time ms - :res[content-length] - :user - :req-headers-authorization - :req-params - :req-body';
app.use(morgan(extensiveLogFormat, { stream: accessExtensiveLogStream }));

// Dev logs
app.use(morgan("dev"));

// Set JSON limit
app.use(express.json({ limit: "200kb" }));

// app.set("trust proxy", true);
const userLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: "Too many requests from this IP, please try again after 5 minutes",
    code: 429, // Optional: you might want to include a specific error code
  },
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: "Too many requests from this IP, please try again after 5 minutes",
    code: 429, // Optional: you might want to include a specific error code
  },
});

// Serve static files
app.use(express.static(path.join(__dirname, "/client/build")));
const { requireRoleAuth } = require("./middleware/requireRoleAuth");

// Route definitions
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const presenterRoutes = require("./routes/presenter");
const globalRoutes = require("./routes/global");

app.set("trust proxy", 2);
app.get("/ip", (request, response) => response.send(request.ip));

// Apply general rate limiter
app.use(userLimiter);

// Login Route
const { loginUser } = require("./controllers/userController");
app.post("/api/login", loginUser);

// Apply specific limiters to specific routes
app.use("/api/admin", adminLimiter, requireRoleAuth(["admin"]), adminRoutes);
app.use("/api/presenter", requireRoleAuth(["presenter", "admin"]), presenterRoutes);
app.use("/api/student", requireRoleAuth(["student", "admin"]), studentRoutes);
app.use("/api/global", requireRoleAuth(["student", "presenter", "admin"]), globalRoutes);

// Fallback route to serve client-side application
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/client/build/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Database and server start

mongoose
  .connect(process.env.MONGO_URI, {
    socketTimeoutMS: 360000, // Close sockets after 6 minutes of inactivity
    connectTimeoutMS: 30000, // Connection timeout after 30 seconds
  })
  .catch((error) => {
    console.log("Failed to connect to MongoDB:", error);
  });

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${process.env.PORT}`);
});

// Connections
const db = mongoose.connection;
db.on("connected", () => console.log("Connected to MongoDB"));
db.on("error", (err) => console.error("MongoDB connection error:", err));
db.on("disconnected", () => console.log("Disconnected from MongoDB"));
db.on("reconnected", () => console.log("Reconnected to MongoDB"));
db.on("timeout", (err) => console.log("MongoDB connection timeout:", err));

function gracefulShutdown() {
  console.log("Shutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
