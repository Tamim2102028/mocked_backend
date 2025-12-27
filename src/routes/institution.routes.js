import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getInstitutionFeed,
  createInstitutionPost,
  getInstitutionDetails,
  getDepartmentsList,
  toggleInstitutionFollow,
  toggleInstitutionPostLike,
  toggleInstitutionPostRead,
  deleteInstitutionPost,
  updateInstitutionPost,
  getInstitutionPostComments,
  createInstitutionPostComment,
  deleteInstitutionPostComment,
  updateInstitutionPostComment,
  toggleInstitutionPostCommentLike,
} from "../controllers/institution.controllers.js";

const router = Router();
router.use(verifyJWT);

router.post("/:instId/follow", toggleInstitutionFollow);
router.get("/:instId", getInstitutionDetails);
router.get("/:instId/feed", getInstitutionFeed);
router.get("/:instId/departments", getDepartmentsList);
router.post("/:instId/post", createInstitutionPost);

// ==========================================
// 🚀 POST & COMMENT ACTIONS
// ==========================================
router.post("/posts/:postId/like", toggleInstitutionPostLike);
router.post("/posts/:postId/read", toggleInstitutionPostRead);
router.delete("/posts/:postId", deleteInstitutionPost);
router.patch("/posts/:postId", updateInstitutionPost);

router.get("/posts/:postId/comments", getInstitutionPostComments);
router.post("/posts/:postId/comments", createInstitutionPostComment);
router.delete("/comments/:commentId", deleteInstitutionPostComment);
router.patch("/comments/:commentId", updateInstitutionPostComment);
router.post("/comments/:commentId/like", toggleInstitutionPostCommentLike);

export default router;
