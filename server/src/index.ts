import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import pollRoutes from "./routes/poll.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { registerSocket } from "./socket/socketHandler.js";
import { ResponseModel } from "./models/Response.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL?.split(",") ?? ["http://localhost:5173"],
    credentials: true,
  },
});
registerSocket(io);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(",") ?? ["http://localhost:5173"], credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "poll-shinobi" });
});

app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 8080);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is required");
}

void connectDB(MONGO_URI).then(async () => {
  await ResponseModel.syncIndexes();

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
