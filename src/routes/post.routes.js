import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  toggleLikePost,
  toggleMarkAsRead,
  getFeedPosts,
  deletePost,
  updatePost,
} from "../controllers/post.controllers.js";

const router = express.Router();

router.use(verifyJWT);

// Create & Feed
router.post("/", createPost);
router.get("/feed", getFeedPosts);

// Actions
router.post("/:postId/toggle-like", toggleLikePost);
router.delete("/:postId", deletePost);
router.patch("/:postId", updatePost);

// ✅ View/Read Toggle Route
router.post("/:postId/toggle-read", toggleMarkAsRead);

export default router;
