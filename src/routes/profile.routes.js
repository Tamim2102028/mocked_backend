import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getUserProfilePosts,
  createProfilePost,
  toggleProfilePostLike,
  toggleProfilePostRead,
  deleteProfilePost,
  updateProfilePost,
  getProfilePostComments,
  createProfilePostComment,
  deleteProfilePostComment,
  updateProfilePostComment,
  toggleProfilePostCommentLike,
} from "../controllers/profile.controllers.js";

const router = Router();

router.use(verifyJWT);

// ==========================================
// 🚀 PROFILE POSTS ROUTES
// ==========================================

// Get user profile posts
router.get("/:username/posts", getUserProfilePosts);

// Create profile post
router.post("/post", createProfilePost);

// Post Actions
router.post("/posts/:postId/like", toggleProfilePostLike);
router.post("/posts/:postId/read", toggleProfilePostRead);
router.delete("/posts/:postId", deleteProfilePost);
router.patch("/posts/:postId", updateProfilePost);

// Comment Actions
router.get("/posts/:postId/comments", getProfilePostComments);
router.post("/posts/:postId/comments", createProfilePostComment);
router.delete("/comments/:commentId", deleteProfilePostComment);
router.patch("/comments/:commentId", updateProfilePostComment);
router.post("/comments/:commentId/like", toggleProfilePostCommentLike);

export default router;
