import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getCrFeed,
  createCrPost,
  toggleCrPostLike,
  toggleCrPostRead,
  deleteCrPost,
  updateCrPost,
  getCrPostComments,
  createCrPostComment,
  deleteCrPostComment,
  updateCrPostComment,
  toggleCrPostCommentLike,
} from "../controllers/cr.controllers.js";

const router = Router();
router.use(verifyJWT);

router.get("/feed", getCrFeed);
router.post("/post", createCrPost);

// ==========================================
// 🚀 POST & COMMENT ACTIONS
// ==========================================
router.post("/posts/:postId/like", toggleCrPostLike);
router.post("/posts/:postId/read", toggleCrPostRead);
router.delete("/posts/:postId", deleteCrPost);
router.patch("/posts/:postId", updateCrPost);

router.get("/posts/:postId/comments", getCrPostComments);
router.post("/posts/:postId/comments", createCrPostComment);
router.delete("/comments/:commentId", deleteCrPostComment);
router.patch("/comments/:commentId", updateCrPostComment);
router.post("/comments/:commentId/like", toggleCrPostCommentLike);

export default router;
