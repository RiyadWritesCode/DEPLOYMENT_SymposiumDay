const express = require("express");

// Controller functions
const {
  getSymposiumCreatedClasses,
  createClass,
  updateClass,
  deleteClass,
  updateClassAttendance,
  getClass,
} = require("../controllers/classController");

const router = express.Router();

router.get("/symposiums/:symposium_id/classes/presenter/:presenter_id", getSymposiumCreatedClasses);

router.get("/classes/:id", getClass);

router.patch("/classes/:class_id/update-attendance", updateClassAttendance);

router.patch("/classes/:id", updateClass);

// Create a class
router.post("/classes/create", createClass);

// Delete a class
router.delete("/classes/:id", deleteClass);

// Update a class

module.exports = router;
