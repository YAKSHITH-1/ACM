import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import User from "../models/user.model.js";

import asyncHandler from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";
import { normalizeEmail } from "../utils/stringUtils.js";

import {
  registerService,
  loginService
} from "../services/auth.service.js";


const buildVerificationEmail = (verificationCode) => `
  <div style="
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    padding: 40px;
  ">
    <div style="
      max-width: 500px;
      background: white;
      margin: auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    ">
      <div style="
        background: #111827;
        padding: 20px;
        text-align: center;
      ">
        <img
          src="https://via.placeholder.com/150/111827/FFFFFF?text=ACM+JIT"
          alt="Logo"
          width="80"
        />
        <h1 style="
          color: white;
          margin-top: 10px;
        ">
          ACM Portal
        </h1>
      </div>
      <div style="padding: 30px; text-align:center;">
        <h2>Email Verification</h2>
        <p>
          Use the verification code below to verify your account.
        </p>
        <div style="
          font-size: 40px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #2563eb;
          margin: 30px 0;
        ">
          ${verificationCode}
        </div>
        <p style="color: gray;">
          This code expires in 10 minutes.
        </p>
      </div>
      <div style="
        background: #f9fafb;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: gray;
      ">
        © 2026 ACM Portal. All rights reserved.
      </div>
    </div>
  </div>
`;

// REGISTER
export const register = asyncHandler(async (req, res) => {

  const email = normalizeEmail(req.body.email);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists"
    });
  }

  const verificationCode =
    Math.floor(1000 + Math.random() * 9000).toString();

  const user = await registerService({
    name: String(req.body.name || "").trim(),
    email,
    password: String(req.body.password || ""),
    verificationCode,
    verificationCodeExpire:
      Date.now() + 10 * 60 * 1000
  });

  try {
    await sendEmail(
      user.email,
      "Verify Your Email",
      buildVerificationEmail(verificationCode)
    );
  } catch (emailErr) {
    // Roll back: remove the user so they can retry registration
    await User.findByIdAndDelete(user._id);
    const response = {
      success: false,
      message: "Failed to send verification email. Please try again."
    };
    // Only include debug info in development
    if (process.env.NODE_ENV !== "production") {
      response.debugError = emailErr.message || emailErr.name || JSON.stringify(emailErr);
    }
    return res.status(500).json(response);
  }

  res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email."
  });

});


// Helper to return sanitized user object (never leaks refreshToken, passwords, or internal fields)
export const formatSafeUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: Boolean(user.isVerified)
  };
};

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  ...(maxAge ? { maxAge } : {})
});

// LOGIN
export const login = asyncHandler(async (req, res) => {

  const email = normalizeEmail(req.body.email);

  const { user, accessToken, refreshToken } =
    await loginService(
      email,
      req.body.password
    );

  res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

  res.status(200).json({
    success: true,
    user: formatSafeUser(user),
    accessToken
  });

});


// LOGOUT
export const logout = asyncHandler(async (req, res) => {

  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    } catch (e) {
      // Continue clearing cookies even if verification fails
    }
  }

  const clearOptions = getCookieOptions();
  res.clearCookie("accessToken", clearOptions);
  res.clearCookie("refreshToken", clearOptions);

  res.status(200).json({
    success: true,
    message: "Logged out"
  });

});


// REFRESH TOKEN
export const refreshToken = asyncHandler(async (req, res) => {

  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No refresh token"
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );
  } catch (err) {
    const clearOptions = getCookieOptions();
    res.clearCookie("accessToken", clearOptions);
    res.clearCookie("refreshToken", clearOptions);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token"
    });
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== token) {
    const clearOptions = getCookieOptions();
    res.clearCookie("accessToken", clearOptions);
    res.clearCookie("refreshToken", clearOptions);
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }

  const accessToken = jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE
    }
  );

  const newRefreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );

  user.refreshToken = newRefreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", newRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

  res.status(200).json({
    success: true,
    accessToken,
    user: formatSafeUser(user)
  });

});


// FORGOT PASSWORD
export const forgotPassword = asyncHandler(async (req, res) => {

  const email = normalizeEmail(req.body.email);

  const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Generate a 4‑digit numeric code
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  // Store the code directly (plain text) – it is short enough for email
  user.resetPasswordToken = code;
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

  await user.save();

  await sendEmail(
    user.email,
    "Reset Password",
    `
    <h2>Password Reset</h2>

    <p>
      Use the 4‑digit code below to reset your password:
    </p>

    <h3>${code}</h3>

    <p>
      This token expires in 1 hour.
    </p>
  `

  );

  res.status(200).json({
    success: true,
    message: "Reset email sent"
  });

});


// VERIFY RESET TOKEN
export const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    resetPasswordToken: token,
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  if (user.resetPasswordExpire < new Date()) {
    return res.status(400).json({
      success: false,
      message: "Token expired",
    });
  }

  res.status(200).json({
    success: true,
    message: "Token is valid",
  });
});


// RESET PASSWORD
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
  }).select("+password +resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  if (user.resetPasswordExpire < new Date()) {
    return res.status(400).json({
      success: false,
      message: "Token expired",
    });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshToken = null; // Invalidate old refresh token on password reset

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});


// VERIFY EMAIL
export const verifyEmail = asyncHandler(async (req, res) => {

  const { email, code } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    verificationCode: String(code || ""),
    verificationCodeExpire: {
      $gt: new Date()
    }
  }).select("+verificationCode +verificationCodeExpire +refreshToken");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification code"
    });
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpire = undefined;

  // Auto-login: generate tokens
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    accessToken,
    user: formatSafeUser(user)
  });

});


// PROFILE
export const getProfile = asyncHandler(async (req, res) => {

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  res.status(200).json({
    success: true,
    user: formatSafeUser(user)
  });

});

// UPDATE PROFILE NAME
export const updateProfileName = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, message: "Name is required" });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.name = name.trim();
  await user.save();

  res.status(200).json({
    success: true,
    message: "Name updated successfully",
    user: formatSafeUser(user)
  });

});