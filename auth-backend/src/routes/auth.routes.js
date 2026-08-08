import express from "express";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  getProfile,
  updateProfileName
} from "../controllers/auth.controller.js";

import validate from "../middlewares/validate.middleware.js";

import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetTokenValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  profileNameValidator
} from "../validators/auth.validator.js";

import {
  protect,
  authorize
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Auth routes with combined IP+account rate limiting and exponential backoff
router.post(
  "/register",
  authRateLimiter(),
  registerValidator,
  validate,
  register
);

router.post(
  "/login",
  authRateLimiter(),
  loginValidator,
  validate,
  login
);

router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

router.post(
  "/forgot-password",
  authRateLimiter(),
  forgotPasswordValidator,
  validate,
  forgotPassword
);

router.post(
  "/verify-reset-token/:token",
  authRateLimiter(),
  verifyResetTokenValidator,
  validate,
  verifyResetToken
);

router.post(
  "/reset-password/:token",
  authRateLimiter(),
  resetPasswordValidator,
  validate,
  resetPassword
);

router.post(
  "/verify-email",
  authRateLimiter(),
  verifyEmailValidator,
  validate,
  verifyEmail
);

// Protected user profile routes (looser limits will be applied globally via app middleware)
router.get(
  "/profile",
  protect,
  getProfile
);

router.put(
  "/profile/name",
  protect,
  profileNameValidator,
  validate,
  updateProfileName
);

router.get(
  "/admin",
  protect,
  authorize("admin"),
  (req, res) => {
    res.json({
      message: "Admin Route"
    });
  }
);

export default router;