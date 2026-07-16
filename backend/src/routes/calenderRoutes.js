const express = require("express");

const router = express.Router();

const calendar = require("../controllers/calenderController.js");

router.get("/events", calendar.getEvents);

router.post("/events", calendar.createEvent);

router.patch("/events/:id", calendar.updateEvent);

router.delete("/events/:id", calendar.deleteEvent);
router.get("/status", calendar.getStatus);
module.exports = router;