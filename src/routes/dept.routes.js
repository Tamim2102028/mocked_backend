import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getDeptFeed,
  createDeptPost,
  getDeptDetails,
  getTeachers,
  toggleDeptPostLike,
  toggleDeptPostRead,
  deleteDeptPost,
  updateDeptPost,
  getDeptPostComments,
  createDeptPostComment,
  deleteDeptPostComment,
  updateDeptPostComment,
  toggleDeptPostCommentLike,
  toggleDeptFollow,
} from "../controllers/dept.controllers.js";

const router = Router();
router.use(verifyJWT);

router.post("/:deptId/follow", toggleDeptFollow);
router.get("/:deptId", getDeptDetails);
router.get("/:deptId/feed", getDeptFeed);
router.get("/:deptId/teachers", getTeachers);
router.post("/:deptId/post", createDeptPost);

// ==========================================
// 🚀 POST & COMMENT ACTIONS
// ==========================================
router.post("/posts/:postId/like", toggleDeptPostLike);
router.post("/posts/:postId/read", toggleDeptPostRead);
router.delete("/posts/:postId", deleteDeptPost);
router.patch("/posts/:postId", updateDeptPost);

router.get("/posts/:postId/comments", getDeptPostComments);
router.post("/posts/:postId/comments", createDeptPostComment);
router.delete("/comments/:commentId", deleteDeptPostComment);
router.patch("/comments/:commentId", updateDeptPostComment);
router.post("/comments/:commentId/like", toggleDeptPostCommentLike);

export default router;
