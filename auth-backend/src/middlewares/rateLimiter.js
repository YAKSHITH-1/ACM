// rateLimiter.js
// Custom rate limiter with IP+account key and exponential backoff for auth routes

import { config } from "dotenv";
config();

const attempts = new Map(); // key -> { count, firstTime, lastReset }

// Configuration from env with defaults
const WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5; // max attempts per window
const BASE_RETRY_MS = parseInt(process.env.AUTH_BASE_RETRY_MS) || 60 * 1000; // 1 min base

/**
 * Middleware for auth routes with IP+account tracking and exponential backoff
 * @param {Object} options - { keyGenerator: (req) => string, skip: (req) => boolean }
 */
export function authRateLimiter(options = {}) {
  const { keyGenerator = defaultKeyGenerator, skip = () => false } = options;

  return async function rateLimiterMiddleware(req, res, next) {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    if (!key) {
      return next(); // cannot generate key, skip limiting
    }

    const now = Date.now();
    const record = attempts.get(key) || { count: 0, firstTime: now, lastReset: now };

    // Reset if window passed
    if (now - record.firstTime > WINDOW_MS) {
      record.count = 0;
      record.firstTime = now;
    }

    record.count += 1;
    record.lastReset = now;
    attempts.set(key, record);

    if (record.count > MAX_ATTEMPTS) {
      // Exponential backoff: base * 2^(excess)
      const excess = record.count - MAX_ATTEMPTS;
      const retryAfterMs = BASE_RETRY_MS * Math.pow(2, excess);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      res.set("Retry-After", retryAfterSec.toString());
      return res.status(429).json({
        error: "Too many requests, please try again later.",
        retryAfter: retryAfterSec,
      });
    }

    // Attach info for potential use in controllers (optional)
    req.rateLimit = {
      limit: MAX_ATTEMPTS,
      remaining: Math.max(0, MAX_ATTEMPTS - record.count),
      resetTime: new Date(record.firstTime + WINDOW_MS),
    };

    next();
  };
}

/**
 * Default key generator: combine IP and account identifier (email from body)
 * For requests without email (e.g., token-based), fallback to IP only.
 */
function defaultKeyGenerator(req) {
  // Get IP (trust proxy)
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
  // Clean IP ( IPv6 ::ffff: )
  const cleanIp = ip ? ip.replace(/^::ffff:/, "") : "unknown";

  // Try to get email from body (for register, login, forgot-password, etc.)
  let account = "";
  if (req.body && req.body.email) {
    account = req.body.email.toLowerCase().trim();
  }
  // If no email in body, maybe from query or params? Not needed for now.

  // If account found, combine; else just IP
  if (account) {
    return `${cleanIp}:${account}`;
  }
  return cleanIp;
}

// Export a simpler limiter for public endpoints using standard express-rate-limit
import rateLimit from "express-rate-limit";

/**
 * General API rate limiter (moderate) - IP based
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100, // 100 requests
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Stricter limiter for authenticated user actions (looser than auth but stricter than public?)
 * Actually we want looser limits on authenticated user actions (after auth).
 * We'll use a higher limit.
 */
export const authUserLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_USER_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_USER_RATE_LIMIT_MAX) || 300, // 5 min? but keep generous
  standardHeaders: true,
  legacyHeaders: false,
});
