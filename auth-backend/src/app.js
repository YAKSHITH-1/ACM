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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const isLocalhost =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === "http://localhost" ||
        origin === "http://127.0.0.1";

      const isProductionClient = origin === process.env.CLIENT_URL;

      if (isLocalhost || isProductionClient) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.use(errorMiddleware);

export default app;