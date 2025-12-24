import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      "http://localhost:5174", // pore remove kore dite hobe egula
      "http://localhost:5173", // pore remove kore dite hobe egula
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ⏳ Global Latency Simulation Middleware
// app.use(async (req, res, next) => {
//   await new Promise((resolve) => setTimeout(resolve, 5000)); // 3 second delay
//   next();
// });

// Import and use routes
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import commentRouter from "./routes/comment.routes.js";
import crRouter from "./routes/cr.routes.js";
import groupRouter from "./routes/group.routes.js";
import deptRouter from "./routes/dept.routes.js";
import roomRouter from "./routes/room.routes.js";
import institutionRouter from "./routes/institution.routes.js";
import friendshipRouter from "./routes/friendship.routes.js";
import followRouter from "./routes/follow.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/cr-corner", crRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/depts", deptRouter);
app.use("/api/v1/rooms", roomRouter);
app.use("/api/v1/institutions", institutionRouter);
app.use("/api/v1/friendships", friendshipRouter);
app.use("/api/v1/follows", followRouter);

// ⚠️ সবার শেষে এটা বসাতে হবে
app.use(errorHandler);
export default app;
