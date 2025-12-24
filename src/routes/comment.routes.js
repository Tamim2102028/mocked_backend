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

router.get("/post/:postId", getPostComments);
router.post("/post/:postId", addComment);
router.delete("/:commentId", deleteComment);
router.patch("/:commentId", updateComment);

export default router;
