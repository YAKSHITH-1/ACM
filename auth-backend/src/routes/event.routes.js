import express from "express";
import { apiLimiter, authUserLimiter } from "../middlewares/rateLimiter.js";
import validate from "../middlewares/validate.middleware.js";

import {
  registerForEvent,
  getRegistrations,
  deleteRegistration,
  getMyRegistrations
} from "../controllers/event.controller.js";

import {
  getEvents,
  createEvent,
  deleteEvent
} from "../controllers/eventCrud.controller.js";

import {
  protect,
  authorize
} from "../middlewares/auth.middleware.js";

import {
  createEventValidator,
  registerForEventValidator,
  getRegistrationsValidator,
  deleteRegistrationValidator,
  deleteEventValidator
} from "../validators/event.validator.js";

const router = express.Router();

// Public endpoint: get events (moderate limiting)
router.get("/", apiLimiter, getEvents);

// Event CRUD (protected, looser limits for authenticated users)
router.post(
  "/",
  protect,
  authorize("admin"),
  authUserLimiter,
  createEventValidator,
  validate,
  createEvent
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  authUserLimiter,
  deleteEventValidator,
  validate,
  deleteEvent
);


// User registers for an event (must be logged in)
router.post(
  "/register",
  protect,
  authUserLimiter,
  registerForEventValidator,
  validate,
  registerForEvent
);

// User gets their own registrations
router.get(
  "/my-registrations",
  protect,
  authUserLimiter,
  getMyRegistrations
);

// Admin gets all registrations (with optional filters)
router.get(
  "/registrations",
  protect,
  authorize("admin"),
  authUserLimiter,
  getRegistrationsValidator,
  validate,
  getRegistrations
);

// Admin deletes a registration
router.delete(
  "/registrations/:id",
  protect,
  authorize("admin"),
  authUserLimiter,
  deleteRegistrationValidator,
  validate,
  deleteRegistration
);

export default router;