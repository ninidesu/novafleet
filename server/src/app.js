import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import api from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  // In development, allow any localhost origin (Vite on 5173, Expo web on 8081/
  // 19006, etc.) so the web + mobile dev servers can call the API. In production
  // only the explicitly configured origins are allowed.
  const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        if (!env.isProduction && isLocalOrigin(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.isProduction ? "combined" : "dev"));

  app.get("/", (_req, res) => res.json({ service: "novafleet-api", docs: "/api/health" }));
  app.use("/api", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
