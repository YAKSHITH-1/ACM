import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";



import errorMiddleware from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Trust the reverse proxy (required for Render so rate-limiting works correctly)
app.set("trust proxy", 1);

// Serve static files from the root directory (for Google verification file and frontend)
app.use(express.static(path.join(__dirname, "../../")));
app.use(express.static(path.join(__dirname, "../../frontendCSS")));

app.use(express.json());

app.use(cookieParser());

// Security headers
app.use(helmet());

// Health check endpoint (for uptime monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Allowed origins list: defaults to acmjit.com, current Vercel domain, + optional environment variables
const configuredOrigins = [
  "https://acmjit.com",
  "https://www.acmjit.com",
  "https://jyothyacm.vercel.app",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map(o => o.trim().replace(/\/$/, "")) : []),
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim().replace(/\/$/, "")) : [])
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const isLocalhost =
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin === "http://localhost" ||
    origin === "http://127.0.0.1";

  if (isLocalhost) return true;

  return (
    configuredOrigins.includes(origin) ||
    origin === "https://acmjit.com" ||
    origin === "https://www.acmjit.com" ||
    origin.endsWith(".acmjit.com") ||
    origin.endsWith(".vercel.app")
  );
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.use(errorMiddleware);

export default app; 