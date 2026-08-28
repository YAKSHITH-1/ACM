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


const buildVerificationEmail = (verificationCode) => {
  const digits = String(verificationCode).split("");
  const cardBgColors = ["#A7F3D0", "#BAE6FD", "#FDE047", "#DDD6FE"]; // Mint, Sky, Yellow, Purple pastel cards
  
  const digitBoxes = digits
    .map(
      (d, i) => `
      <td class="otp-td" align="center" valign="middle" style="padding: 0 6px;">
        <div class="otp-box" style="
          width: 58px;
          height: 68px;
          line-height: 68px;
          background-color: ${cardBgColors[i % cardBgColors.length]};
          border: 2.5px solid #0B0F0D;
          border-radius: 14px;
          box-shadow: 4px 4px 0px #0B0F0D;
          color: #0B0F0D;
          font-size: 36px;
          font-weight: 900;
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          text-align: center;
        ">${d}</div>
      </td>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your ACM JIT Account</title>
  <style>
    @media only screen and (max-width: 480px) {
      .email-wrap { padding: 18px 8px !important; }
      .email-card { width: 100% !important; border-radius: 18px !important; box-shadow: 5px 5px 0px #0B0F0D !important; }
      .email-header { padding: 26px 16px 14px 16px !important; }
      .badge-tag { padding: 5px 12px !important; font-size: 10px !important; }
      .email-title { font-size: 22px !important; margin-top: 14px !important; }
      .email-desc { font-size: 13px !important; }
      .otp-container { padding: 12px 8px 18px 8px !important; }
      .otp-td { padding: 0 3px !important; }
      .otp-box { width: 46px !important; height: 56px !important; line-height: 56px !important; font-size: 28px !important; border-radius: 10px !important; box-shadow: 3px 3px 0px #0B0F0D !important; border-width: 2px !important; }
      .expiry-pill { padding: 5px 12px !important; font-size: 11px !important; }
      .security-pad { padding: 0 16px 20px 16px !important; }
      .security-box { padding: 12px 14px !important; }
      .footer-box { padding: 16px !important; }
    }
    @media only screen and (max-width: 360px) {
      .otp-td { padding: 0 2px !important; }
      .otp-box { width: 40px !important; height: 50px !important; line-height: 50px !important; font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #111A16; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" class="email-wrap" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #111A16; padding: 40px 12px;">
    <tr>
      <td align="center">
        <!-- Main Neobrutalist Card Stage -->
        <table role="presentation" class="email-card" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FCFCFD; border: 3px solid #0B0F0D; border-radius: 24px; box-shadow: 8px 8px 0px #0B0F0D; overflow: hidden;">
          
          <!-- Top Tag / Pill Header -->
          <tr>
            <td class="email-header" align="center" style="padding: 34px 28px 16px 28px; background-color: #FCFCFD;">
              <!-- Sparkles & Pill Badge -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 18px; color: #FACC15; padding-right: 6px; font-weight: 900;">✦</td>
                  <td class="badge-tag" style="background-color: #FDE047; border: 2px solid #0B0F0D; box-shadow: 2.5px 2.5px 0px #0B0F0D; border-radius: 999px; padding: 6px 18px;">
                    <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #0B0F0D; display: inline-block;">
                      ACM STUDENT CHAPTER • JIT
                    </span>
                  </td>
                  <td style="font-size: 18px; color: #FB7185; padding-left: 6px; font-weight: 900;">★</td>
                </tr>
              </table>

              <h1 class="email-title" style="margin: 18px 0 0 0; font-size: 28px; font-weight: 900; color: #0B0F0D; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.15;">
                CONFIRM YOUR ACCESS
              </h1>
              <p class="email-desc" style="margin: 10px 0 0 0; font-size: 14px; font-weight: 600; line-height: 1.5; color: #475569; max-width: 380px;">
                Enter this 4-digit passkey on the verification page to activate your official chapter account.
              </p>
            </td>
          </tr>

          <!-- 4-Digit Chunky Number Boxes -->
          <tr>
            <td class="otp-container" align="center" style="padding: 16px 24px 24px 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  ${digitBoxes}
                </tr>
              </table>

              <!-- Neobrutalist Expiry Pill -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top: 22px;">
                <tr>
                  <td class="expiry-pill" style="background-color: #FEF3C7; border: 2px solid #0B0F0D; box-shadow: 2px 2px 0px #0B0F0D; border-radius: 999px; padding: 6px 16px;">
                    <span style="font-size: 12px; color: #78350F; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                      ⏱ Valid for 10 minutes only
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Neobrutalist Security Box -->
          <tr>
            <td class="security-pad" style="padding: 0 28px 28px 28px;">
              <table role="presentation" class="security-box" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 2px solid #0B0F0D; box-shadow: 3px 3px 0px #0B0F0D; border-radius: 16px; padding: 14px 18px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #334155; font-weight: 600;">
                      <strong style="color: #0B0F0D; font-weight: 800;">🔒 Security Note:</strong> If you did not request this code, no account was created and you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td class="footer-box" align="center" style="background-color: #0B0F0D; border-top: 3px solid #0B0F0D; padding: 20px 24px;">
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #F8FAFC; letter-spacing: 0.5px; text-transform: uppercase;">
                ACM STUDENT CHAPTER • JYOTHY INSTITUTE OF TECHNOLOGY
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94A3B8;">
                Tataguni, Kanakapura Road, Bengaluru, Karnataka 560082
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #64748B;">
                © 2026 ACM JIT Chapter. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const buildResetPasswordEmail = (rawToken) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your ACM JIT Password</title>
  <style>
    @media only screen and (max-width: 480px) {
      .email-wrap { padding: 18px 8px !important; }
      .email-card { width: 100% !important; border-radius: 18px !important; box-shadow: 5px 5px 0px #0B0F0D !important; }
      .email-header { padding: 26px 16px 14px 16px !important; }
      .badge-tag { padding: 5px 12px !important; font-size: 10px !important; }
      .email-title { font-size: 22px !important; margin-top: 14px !important; }
      .email-desc { font-size: 13px !important; }
      .token-container { padding: 10px 16px 18px 16px !important; }
      .token-box { font-size: 11px !important; padding: 12px 8px !important; border-radius: 10px !important; box-shadow: 3px 3px 0px #0B0F0D !important; }
      .expiry-pill { padding: 5px 12px !important; font-size: 11px !important; }
      .security-pad { padding: 0 16px 20px 16px !important; }
      .security-box { padding: 12px 14px !important; }
      .footer-box { padding: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #111A16; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" class="email-wrap" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #111A16; padding: 40px 12px;">
    <tr>
      <td align="center">
        <!-- Main Neobrutalist Card Stage -->
        <table role="presentation" class="email-card" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #FCFCFD; border: 3px solid #0B0F0D; border-radius: 24px; box-shadow: 8px 8px 0px #0B0F0D; overflow: hidden;">
          
          <!-- Top Tag / Pill Header -->
          <tr>
            <td class="email-header" align="center" style="padding: 34px 28px 16px 28px; background-color: #FCFCFD;">
              <!-- Sparkles & Pill Badge -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 18px; color: #FACC15; padding-right: 6px; font-weight: 900;">✦</td>
                  <td class="badge-tag" style="background-color: #FECDD3; border: 2px solid #0B0F0D; box-shadow: 2.5px 2.5px 0px #0B0F0D; border-radius: 999px; padding: 6px 18px;">
                    <span style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #0B0F0D; display: inline-block;">
                      🔑 PASSWORD RECOVERY
                    </span>
                  </td>
                  <td style="font-size: 18px; color: #38BDF8; padding-left: 6px; font-weight: 900;">★</td>
                </tr>
              </table>

              <h1 class="email-title" style="margin: 18px 0 0 0; font-size: 28px; font-weight: 900; color: #0B0F0D; text-transform: uppercase; letter-spacing: -0.5px; line-height: 1.15;">
                RESET YOUR PASSWORD
              </h1>
              <p class="email-desc" style="margin: 10px 0 0 0; font-size: 14px; font-weight: 600; line-height: 1.5; color: #475569; max-width: 400px;">
                Copy and paste this single-use reset token into the password recovery page:
              </p>
            </td>
          </tr>

          <!-- Neobrutalist Token Card -->
          <tr>
            <td class="token-container" align="center" style="padding: 12px 28px 24px 28px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td class="token-box" style="background-color: #BAE6FD; border: 2.5px solid #0B0F0D; box-shadow: 4px 4px 0px #0B0F0D; border-radius: 14px; padding: 16px; font-family: monospace; font-size: 13px; font-weight: 800; color: #0B0F0D; word-break: break-all; text-align: center; user-select: all;">
                    ${rawToken}
                  </td>
                </tr>
              </table>

              <!-- Neobrutalist Expiry Pill -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td class="expiry-pill" style="background-color: #FEF3C7; border: 2px solid #0B0F0D; box-shadow: 2px 2px 0px #0B0F0D; border-radius: 999px; padding: 6px 16px;">
                    <span style="font-size: 12px; color: #78350F; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                      ⏱ Expires in 15 minutes
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td class="security-pad" style="padding: 0 28px 28px 28px;">
              <table role="presentation" class="security-box" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 2px solid #0B0F0D; box-shadow: 3px 3px 0px #0B0F0D; border-radius: 16px; padding: 14px 18px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #334155; font-weight: 600;">
                      <strong style="color: #0B0F0D; font-weight: 800;">🔒 Security Note:</strong> If you did not request a password reset, please ignore this email. Your credentials remain safe.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td class="footer-box" align="center" style="background-color: #0B0F0D; border-top: 3px solid #0B0F0D; padding: 20px 24px;">
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #F8FAFC; letter-spacing: 0.5px; text-transform: uppercase;">
                ACM STUDENT CHAPTER • JYOTHY INSTITUTE OF TECHNOLOGY
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94A3B8;">
                Tataguni, Kanakapura Road, Bengaluru, Karnataka 560082
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #64748B;">
                © 2026 ACM JIT Chapter. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// AES-256-GCM Authenticated Encryption for Ephemeral Signup Tickets
const getTicketKey = () =>
  crypto.createHash("sha256").update(process.env.JWT_ACCESS_SECRET || "acm_secret_fallback_key").digest();

const encryptSignupTicket = (payload) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getTicketKey(), iv);
  const serialized = JSON.stringify({ ...payload, exp: Date.now() + 10 * 60 * 1000 });
  let encrypted = cipher.update(serialized, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
};

const decryptSignupTicket = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(":");
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv("aes-256-gcm", getTicketKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    const payload = JSON.parse(decrypted);
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (err) {
    return null;
  }
};

// REGISTER
export const register = asyncHandler(async (req, res) => {

  const email = normalizeEmail(req.body.email);
  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "");

  const existingUser = await User.findOne({ email });

  // If an already-verified user exists, reject registration
  if (existingUser && existingUser.isVerified) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists"
    });
  }

  // If a stale unverified record exists from a previous attempt, remove it
  if (existingUser && !existingUser.isVerified) {
    await User.findByIdAndDelete(existingUser._id);
  }

  const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const codeHash = crypto.createHash("sha256").update(verificationCode).digest("hex");
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate AES-256-GCM encrypted signup ticket containing pre-verification payload
  const signupToken = encryptSignupTicket({
    type: "signup_ticket",
    name,
    email,
    password: hashedPassword,
    codeHash
  });

  try {
    await sendEmail(
      email,
      "Verify Your Email",
      buildVerificationEmail(verificationCode)
    );
  } catch (emailErr) {
    const response = {
      success: false,
      message: "Failed to send verification email. Please try again."
    };
    if (process.env.NODE_ENV !== "production") {
      response.debugError = emailErr.message || emailErr.name || JSON.stringify(emailErr);
    }
    return res.status(500).json(response);
  }

  // Set signupToken cookie and return in JSON response
  res.cookie("signupToken", signupToken, getCookieOptions(10 * 60 * 1000));

  res.status(201).json({
    success: true,
    message: "Registration code sent. Please verify your email.",
    signupToken
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


// Helper to hash tokens with SHA-256
const hashToken = (token) => {
  return crypto.createHash("sha256").update(String(token).trim()).digest("hex");
};

// FORGOT PASSWORD
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address"
    });
  }

  const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpire");

  // Prevent user enumeration: always respond with success message
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If that email is registered, a password reset token has been sent."
    });
  }

  // Generate cryptographically secure 32-byte (64-hex char) token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  // Store only the hash in MongoDB, expires in 15 minutes
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  await user.save();

  try {
    await sendEmail(
      user.email,
      "Reset Your Password",
      buildResetPasswordEmail(rawToken)
    );
  } catch (emailErr) {
    // Roll back reset token if email sending failed
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.error("Failed to send reset email:", emailErr);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset email. Please try again later."
    });
  }

  res.status(200).json({
    success: true,
    message: "If that email is registered, a password reset token has been sent."
  });
});


// VERIFY RESET TOKEN
export const verifyResetToken = asyncHandler(async (req, res) => {
  const token = String(req.params.token || req.body.token || "").trim();
  const email = normalizeEmail(req.body.email || req.query.email);

  if (!email || !token) {
    return res.status(400).json({
      success: false,
      message: "Email and reset token are required"
    });
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    email,
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() }
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token"
    });
  }

  res.status(200).json({
    success: true,
    message: "Token is valid"
  });
});


// RESET PASSWORD
export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.params.token || req.body.token || "").trim();
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!email || !token || !password) {
    return res.status(400).json({
      success: false,
      message: "Email, reset token, and new password are required"
    });
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    email,
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: new Date() }
  }).select("+password +resetPasswordToken +resetPasswordExpire");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token"
    });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshToken = null; // Invalidate old refresh token on password reset

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful"
  });
});


// VERIFY EMAIL
export const verifyEmail = asyncHandler(async (req, res) => {

  const { email, code } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const signupToken = req.body.signupToken || req.cookies.signupToken;
  const inputCode = String(code || "").trim();

  let user = null;

  if (signupToken) {
    const decoded = decryptSignupTicket(signupToken);
    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Verification session expired. Please sign up again."
      });
    }

    if (decoded.type !== "signup_ticket" || decoded.email !== normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification session"
      });
    }

    const inputCodeHash = crypto.createHash("sha256").update(inputCode).digest("hex");
    if (inputCodeHash !== decoded.codeHash) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }

    // Ensure user doesn't already exist
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (existing.isVerified) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists"
        });
      }
      await User.findByIdAndDelete(existing._id);
    }

    // Create user in database ONLY NOW upon successful verification
    user = await User.create({
      name: decoded.name,
      email: decoded.email,
      password: decoded.password,
      isVerified: true
    });
  } else {
    // Fallback for pre-existing database verification records
    user = await User.findOne({
      email: normalizedEmail,
      verificationCode: inputCode,
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
  }

  // Clear signup token cookie
  const clearOptions = getCookieOptions();
  res.clearCookie("signupToken", clearOptions);

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