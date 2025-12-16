import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  getFeed,
  getUserPosts,
  likePost,
  addComment,
  toggleMarkAsRead,
  getUserProfilePosts,
} from "../controllers/post.controllers.js";

const router = express.Router();

router.use(verifyJWT);

// Create & Feed
router.post("/", createPost);
router.get("/feed", getFeed);
router.get("/u/:username", getUserPosts); // ✅ User specific posts

// Actions
router.post("/:postId/like", likePost);
router.post("/:postId/comments", addComment);

// ✅ View/Read Toggle Route
router.post("/:postId/toggle-read", toggleMarkAsRead);

// Profile Posts
router.get("/profile/:username", getUserProfilePosts);

export default router;
