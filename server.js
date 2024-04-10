// To access .env variables (sensitive data)
require("dotenv").config();

// Import express, web application framework for nodejs
const express = require("express");
// Import mongoose library to access MongoDB
const mongoose = require("mongoose");
// HTTP request logger middleware for nodejs
const morgan = require("morgan");
const chalk = require("chalk");
const rfs = require("rotating-file-stream");
const fs = require("fs");

const { requireRoleAuth } = require("./middleware/requireRoleAuth");

// Registering routes
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const presenterRoutes = require("./routes/presenter");
const globalRoutes = require("./routes/global");

// Resolving dirname for ES module
const path = require("path");

// Initialize express app
const app = express();

// Middleware required to parse JSON bodies (access via req.body)
app.use(express.json({ limit: "200kb" }));

// Morgan dev preset
const morganMiddleware = morgan(function (tokens, req, res) {
  return [
    chalk.hex("#ff4757").bold("🍄  Morgan --> "),
    chalk.hex("#34ace0").bold(tokens.method(req, res)),
    chalk.hex("#ffb142").bold(tokens.status(req, res)),
    chalk.hex("#ff5252").bold(tokens.url(req, res)),
    chalk.hex("#2ed573").bold(tokens["response-time"](req, res) + " ms"),
    chalk.hex("#f78fb3").bold("@ " + tokens.date(req, res)),
    chalk.yellow(tokens["remote-addr"](req, res)),
    chalk.hex("#fffa65").bold("from " + tokens.referrer(req, res)),
    chalk.hex("#1e90ff")(tokens["user-agent"](req, res)),
    "\n",
  ].join(" ");
});

// Logging to disk
const logDirectory = path.join(__dirname, "log");
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// Create a rotating write stream
const accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: logDirectory,
});

// Write to render logs
app.use(morganMiddleware);
// Morgan setup to write to file/render disk
app.use(morgan("combined", { stream: accessLogStream }));

// Login Route
const { loginUser } = require("./controllers/userController");
app.post("/api/login", loginUser);

// Admin routes
app.use("/api/admin", requireRoleAuth(["admin"]), adminRoutes);

// Presenter routes
app.use("/api/presenter", requireRoleAuth(["presenter", "admin"]), presenterRoutes);

// Student routes
app.use("/api/student", requireRoleAuth(["student", "admin"]), studentRoutes);

// Global routes accessible by admin, presenter, and student
app.use("/api/global", requireRoleAuth(["student", "presenter", "admin"]), globalRoutes);

// Use the client app
app.use(express.static(path.join(__dirname, "/client/build")));

// Render client for any path
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "/client/build/index.html")));

// Connect to DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // Start express server
    app.listen(process.env.PORT, () => {
      console.log("Listening on port: " + process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });
