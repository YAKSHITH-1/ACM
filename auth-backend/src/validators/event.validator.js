import { body, param, query } from "express-validator";

export const createEventValidator = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters")
    .matches(/^[a-zA-Z0-9\s.,'":/&()!?-]+$/)
    .withMessage("Title contains invalid characters"),

  body("date")
    .trim()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date string"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("type")
    .trim()
    .isIn(["upcoming", "past"])
    .withMessage("Type must be either 'upcoming' or 'past'"),

  body("teamSize")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Team size must be a positive integer"),

  body("registrationOpenDate")
    .optional()
    .isISO8601()
    .withMessage("Registration open date must be a valid ISO 8601 date string"),

  body("registrationCloseDate")
    .optional()
    .isISO8601()
    .withMessage("Registration close date must be a valid ISO 8601 date string"),

  body("status")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Status must not exceed 50 characters")
];

export const registerForEventValidator = [
  body("eventId")
    .trim()
    .isLength({ min: 24, max: 24 })
    .isHexadecimal()
    .withMessage("Event ID must be a 24-character hexadecimal string"),

  body("eventTitle")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Event title must be between 3 and 100 characters"),

  body("fullName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Full name can only contain letters, spaces, periods, apostrophes, and hyphens"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("phone")
    .trim()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),

  body("collegeName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("College name must be between 2 and 100 characters"),

  body("usn")
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("USN must be between 5 and 20 characters")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("USN can only contain letters and numbers"),

  body("teamSize")
    .isInt({ min: 1 })
    .withMessage("Team size must be a positive integer"),

  body("teamMembers")
    .optional()
    .isArray({ min: 0 })
    .withMessage("Team members must be an array")
    .custom((value, { req }) => {
      const teamSize = Number(req.body.teamSize);
      if (teamSize > 1) {
        if (!Array.isArray(value) || value.length !== teamSize - 1) {
          throw new Error(`Must provide exactly ${teamSize - 1} team member(s)`);
        }
        for (let i = 0; i < value.length; i++) {
          const member = value[i];
          if (!member.name || !member.usn) {
            throw new Error(`Name and USN required for team member ${i + 1}`);
          }
          if (typeof member.name !== 'string' || typeof member.usn !== 'string') {
            throw new Error(`Team member ${i + 1} name and USN must be strings`);
          }
          // Optional: validate name format, USN format
          if (!member.name.trim().match(/^[a-zA-Z\s.'-]+$/)) {
            throw new Error(`Invalid name format for team member ${i + 1}`);
          }
          if (!member.usn.match(/^[a-zA-Z0-9]+$/)) {
            throw new Error(`Invalid USN format for team member ${i + 1}`);
          }
        }
      }
      return true;
    }),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters")
];

export const getRegistrationsValidator = [
  query("eventId")
    .optional()
    .trim()
    .isLength({ min: 24, max: 24 })
    .isHexadecimal()
    .withMessage("Event ID must be a 24-character hexadecimal string"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query must not exceed 100 characters")
];

export const deleteRegistrationValidator = [
  param("id")
    .trim()
    .isLength({ min: 24, max: 24 })
    .isHexadecimal()
    .withMessage("Registration ID must be a 24-character hexadecimal string")
];

export const deleteEventValidator = [
  param("id")
    .trim()
    .isLength({ min: 24, max: 24 })
    .isHexadecimal()
    .withMessage("Event ID must be a 24-character hexadecimal string")
];