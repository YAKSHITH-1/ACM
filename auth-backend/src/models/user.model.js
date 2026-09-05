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
      select: false,
      maxlength: 1000 // Prevent extremely long passwords that could cause DoS during hashing
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    avatar: {
      type: String,
      default: "",
      maxlength: 2048
    },

    refreshToken: {
      type: String,
      select: false,
      maxlength: 2048 // JWTs should not exceed this size
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verificationCode: {
      type: String,
      select: false,
      maxlength: 4,
      minlength: 4
      // Verification code is generated as a 4-digit number (1000-9999)
    },

    verificationCodeExpire: {
      type: Date,
      select: false
    },

    resetPasswordToken: {
      type: String,
      select: false,
      maxlength: 128
      // Stores the SHA-256 hash of the cryptographically secure reset token
    },

    resetPasswordExpire: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
userSchema.index({ verificationCode: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ email: 1, resetPasswordToken: 1 });

export default mongoose.model("User", userSchema);