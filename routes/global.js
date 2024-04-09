const express = require("express");
const {
  getSymposium,
  getMySymposiums,
  getSymposiumClasses,
} = require("../controllers/symposiumController");
const { getClasses, getClass } = require("../controllers/classController");
const router = express.Router();

router.get("/symposiums/:id", getSymposium);
router.get("/symposiums", getMySymposiums);
router.get("/symposiums/:id/classes", getSymposiumClasses);

module.exports = router;
