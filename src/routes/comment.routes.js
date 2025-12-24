import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getPostComments,
  deleteComment,
  addComment,
  updateComment,
  toggleCommentLike,
} from "../controllers/comment.controllers.js";

const router = Router();
router.use(verifyJWT);

router.get("/post/:postId", getPostComments);
router.post("/post/:postId", addComment);
router.delete("/:commentId", deleteComment);
router.patch("/:commentId", updateComment);
router.post("/:commentId/toggle-like", toggleCommentLike);

export default router;
