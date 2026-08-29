import 'dotenv/config';
import app from "./app.js";

import connectDB from "./config/db.js";
import { startCleanupJob } from "./jobs/cleanupEvents.js";

// Validate essential environment variables
const requiredEnv = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`\n[FATAL STARTUP ERROR] Missing required environment variable(s): ${missingEnv.join(", ")}`);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

connectDB().then(() => {
  startCleanupJob();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});