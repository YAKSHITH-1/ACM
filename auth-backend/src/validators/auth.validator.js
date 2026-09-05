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
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
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
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  param("token")
    .optional()
    .trim()
    .isLength({ min: 10, max: 128 })
    .withMessage("Invalid reset token format"),
  body("token")
    .optional()
    .trim()
    .isLength({ min: 10, max: 128 })
    .withMessage("Invalid reset token format"),
  body().custom((value, { req }) => {
    if (!req.params?.token && !req.body?.token) {
      throw new Error("Reset token is required");
    }
    return true;
  })
];

export const resetPasswordValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  param("token")
    .optional()
    .trim()
    .isLength({ min: 10, max: 128 })
    .withMessage("Invalid reset token format"),
  body("token")
    .optional()
    .trim()
    .isLength({ min: 10, max: 128 })
    .withMessage("Invalid reset token format"),
  body().custom((value, { req }) => {
    if (!req.params?.token && !req.body?.token) {
      throw new Error("Reset token is required");
    }
    return true;
  }),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
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
    .withMessage("Verification code must contain only digits"),
  body("signupToken")
    .optional()
    .trim()
];

export const profileNameValidator = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Name can only contain letters, spaces, periods, apostrophes, and hyphens")
];