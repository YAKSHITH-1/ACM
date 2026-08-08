import { body, param } from "express-validator";

export const registerValidator = [
  body("name")
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

  body("password")
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one digit")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character")
];

export const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail()
];

export const verifyResetTokenValidator = [
  param("token")
    .trim()
    .isLength({ min: 4, max: 4 })
    .withMessage("Token must be a 4-digit numeric code")
    .isNumeric()
    .withMessage("Token must contain only digits")
];

export const resetPasswordValidator = [
  param("token")
    .trim()
    .isLength({ min: 4, max: 4 })
    .withMessage("Token must be a 4-digit numeric code")
    .isNumeric()
    .withMessage("Token must contain only digits"),
  body("password")
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one digit")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character")
];

export const verifyEmailValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("code")
    .trim()
    .isLength({ min: 4, max: 4 })
    .withMessage("Verification code must be exactly 4 digits")
    .isNumeric()
    .withMessage("Verification code must contain only digits")
];

export const profileNameValidator = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Name can only contain letters, spaces, periods, apostrophes, and hyphens")
];