import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getPostComments,
  deleteComment,
  addComment,
  updateComment,
} from "../controllers/comment.controllers.js";

const router = Router();
router.use(verifyJWT);

router.get("/:postId", getPostComments); // GET /api/v1/comments/:postId
router.post("/:postId", addComment); // POST /api/v1/comments/:postId
router.delete("/:commentId", deleteComment);
router.patch("/:commentId", updateComment);

export default router;
