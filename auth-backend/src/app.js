app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        "https://jyothyacm.vercel.app",
        process.env.CLIENT_URL,
      ].filter(Boolean);

      const isLocalhost =
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === "http://localhost" ||
        origin === "http://127.0.0.1";

      if (isLocalhost || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);