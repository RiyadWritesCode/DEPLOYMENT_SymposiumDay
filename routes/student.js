const express = require("express");

// Controller functions
const {
  joinClass,
  leaveClass,
  getSymposiumJoinedClasses,
} = require("../controllers/classController");

const router = express.Router();

// Get all joined classes
router.get("/symposiums/:symposium_id/classes/student/:student_id", getSymposiumJoinedClasses);

// Join class
router.patch("/classes/:id/:studentId/join", joinClass);

// Leave class
router.delete("/classes/:id/:studentId/leave", leaveClass);

module.exports = router;
