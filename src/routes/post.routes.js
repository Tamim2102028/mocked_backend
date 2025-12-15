import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  getFeed,
  likePost,
  addComment,
  toggleMarkAsRead, // ✅ Import this
} from "../controllers/post.controllers.js";

const router = express.Router();

router.use(verifyJWT);

// Create & Feed
router.post("/", createPost);
router.get("/feed", getFeed);

// Actions
router.post("/:postId/like", likePost);
router.post("/:postId/comments", addComment);

// ✅ View/Read Toggle Route
router.post("/:postId/toggle-read", toggleMarkAsRead);

export default router;
