const express = require("express");

// Controller functions
const {
  createUser,
  createBatch,
  getUsers,
  getStudentUsers,
  getPresenterUsers,
  deleteUser,
  updateUser,
  getUser,
} = require("../controllers/userController");

const {
  createSymposium,
  addUsersToSymposiumWithEmails,
  removeUsersFromSymposiumWithEmails,
  removeUserFromSymposium,
  updateSymposium,
  getSymposiums,
  deleteSymposium,
  getSymposiumStudents,
  getSymposiumPresenters,
  addStudentsToSymposiumByGrade,
  removeStudentsFromSymposiumByGrade,
  fillAvailableSpaces,
  sendScheduleToPresenters,
  sendScheduleToStudents,
} = require("../controllers/symposiumController");

const { getClass } = require("../controllers/classController");

const router = express.Router();

// User routes
router.post("/users/create", createUser);
router.post("/users/createBatch", createBatch);
router.get("/users/all", getUsers);
router.get("/users/students", getStudentUsers);
router.get("/users/presenters", getPresenterUsers);
router.get("/users/:id", getUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id", updateUser);

// Symposium Routes
router.post("/symposiums/create", createSymposium);
router.patch("/symposiums/:id", updateSymposium);
router.get("/symposiums/all", getSymposiums);
router.delete("/symposiums/:id", deleteSymposium);
router.get("/symposiums/:id/presenters", getSymposiumPresenters);
router.get("/symposiums/:id/students", getSymposiumStudents);
router.post("/symposiums/:id/users/addWithEmails", addUsersToSymposiumWithEmails);
router.delete("/symposiums/:id/users/removeWithEmails", removeUsersFromSymposiumWithEmails);
router.delete("/symposiums/:id/users/:user_id", removeUserFromSymposium);
router.post("/symposiums/:id/students/addByGrade", addStudentsToSymposiumByGrade);
router.delete("/symposiums/:id/students/removeByGrade", removeStudentsFromSymposiumByGrade);
router.get("/symposiums/:symposium_id/classes/:id", getClass);
router.patch("/symposiums/:symposium_id/fill", fillAvailableSpaces);
router.get("/symposiums/:id/send-schedule-to-presenters", sendScheduleToPresenters);
router.get("/symposiums/:id/send-schedule-to-students", sendScheduleToStudents);

module.exports = router;
