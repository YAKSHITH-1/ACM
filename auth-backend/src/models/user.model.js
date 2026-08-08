import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255
    },

    password: {
      type: String,
      required: true,
      maxlength: 1000 // Prevent extremely long passwords that could cause DoS during hashing
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    refreshToken: {
      type: String,
      maxlength: 2048 // JWTs should not exceed this size
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verificationCode: {
      type: String,
      maxlength: 4,
      minlength: 4
      // Verification code is generated as a 4-digit number (1000-9999)
    },

    verificationCodeExpire: Date,

    resetPasswordToken: {
      type: String,
      maxlength: 4,
      minlength: 4
      // Stores the 4‑digit reset code sent via email
    },

    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
userSchema.index({ verificationCode: 1 });
userSchema.index({ resetPasswordToken: 1 });

export default mongoose.model("User", userSchema);