import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  toggleLikePost,
  addComment,
  toggleMarkAsRead,
  getUserProfilePosts,
  getFeedPosts,
  deletePost,
} from "../controllers/post.controllers.js";

const router = express.Router();

router.use(verifyJWT);

// Create & Feed
router.post("/", createPost);
router.get("/feed", getFeedPosts);

// Actions
router.post("/:postId/toggle-like", toggleLikePost);
router.post("/:postId/comments", addComment);
router.delete("/:postId", deletePost);

// ✅ View/Read Toggle Route
router.post("/:postId/toggle-read", toggleMarkAsRead);

// Profile Posts
router.get("/profile/:username", getUserProfilePosts);

export default router;
