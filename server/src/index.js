import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import dashboardRoutes from "./routes/dashboard.js";
import loanRoutes from "./routes/loans.js";
import paymentRoutes from "./routes/payments.js";
import uploadRoutes from "./routes/uploads.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be set to a random value of at least 32 characters.",
  );
}

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      message: "Too many authentication attempts. Please try again later.",
    },
  }),
);

app.get("/api/health", (request, response) => {
  response.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/customers", requireAuth, customerRoutes);
app.use("/api/loans", requireAuth, loanRoutes);
app.use("/api/payments", requireAuth, paymentRoutes);
app.use("/api/uploads", requireAuth, uploadRoutes);

app.use((request, response) =>
  response
    .status(404)
    .json({ message: "The requested API route was not found." }),
);
app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error?.status === 400)
    return response.status(400).json({ message: error.message });
  if (error?.name === "MulterError") {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Each image must be smaller than 8 MB."
        : "Choose up to 9 images per upload.";
    return response.status(400).json({ message });
  }
  if (error?.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(" ");
    return response.status(400).json({ message });
  }
  if (error?.code === 11000)
    return response
      .status(409)
      .json({ message: "A record with those details already exists." });
  if (error?.name === "CastError")
    return response
      .status(400)
      .json({ message: "A supplied record ID is invalid." });
  console.error(error);
  return response
    .status(500)
    .json({ message: "An unexpected server error occurred." });
});

const port = Number(process.env.PORT) || 5000;
try {
  await connectDatabase();
  app.listen(port, () =>
    console.info(`Five Percentage API listening on port ${port}.`),
  );
} catch (error) {
  console.error(`Unable to start the API: ${error.message}`);
  process.exitCode = 1;
}
