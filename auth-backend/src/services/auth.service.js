import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

import {
  generateAccessToken,
  generateRefreshToken
} from "../utils/generateToken.js";

export const registerService = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    ...data,
    password: hashedPassword,
    verificationToken
  });

  return user;
};

export const loginService = async (email, password) => {
  const user = await User.findOne({ email: String(email) }).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;

  await user.save();

  return {
    user,
    accessToken,
    refreshToken
  };
};