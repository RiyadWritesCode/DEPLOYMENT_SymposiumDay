const express = require("express");

// Controller functions
const {
  getSymposiumCreatedClasses,
  createClass,
  updateClass,
  deleteClass,
  updateClassAttendance,
} = require("../controllers/classController");

const router = express.Router();

router.get("/symposiums/:symposium_id/classes/presenter/:presenter_id", getSymposiumCreatedClasses);

router.patch("/classes/:class_id/update-attendance", updateClassAttendance);
// Create a class
router.post("/classes/create", createClass);

// Delete a class
router.delete("/classes/:id", deleteClass);

// Update a class

module.exports = router;
