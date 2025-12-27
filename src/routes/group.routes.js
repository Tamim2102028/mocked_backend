import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getGroupFeed,
  createGroupPost,
  createGroup,
  getMyGroups,
  getUniversityGroups,
  getCareerGroups,
  getSuggestedGroups,
  getSentRequestsGroups,
  getInvitedGroups,
  joinGroup,
  leaveGroup,
  cancelJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  getGroupDetails,
  getGroupMembers,
  removeMember,
  assignAdmin,
  revokeAdmin,
  toggleGroupPostLike,
  toggleGroupPostRead,
  deleteGroupPost,
  updateGroupPost,
  getGroupPostComments,
  createGroupPostComment,
  deleteGroupPostComment,
  updateGroupPostComment,
  toggleGroupPostCommentLike,
} from "../controllers/group.controllers.js";
import { uploadImage } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

// Group Page Routes
router.post(
  "/",
  uploadImage.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  createGroup
);

router.get("/myGroups", getMyGroups);
router.get("/universityGroups", getUniversityGroups);
router.get("/careerGroups", getCareerGroups);
router.get("/suggestedGroups", getSuggestedGroups);
router.get("/sentRequests", getSentRequestsGroups);
router.get("/invitedGroups", getInvitedGroups);

// Group Card Action Routes
router.post("/:slug/join", joinGroup);
router.post("/:slug/cancel", cancelJoinRequest);
router.post("/:slug/accept", acceptJoinRequest);
router.post("/:slug/reject", rejectJoinRequest);

// Group Details page Routes
router.get("/:slug", getGroupDetails);
router.get("/:groupId/members", getGroupMembers);
router.get("/:slug/feed", getGroupFeed);

// Group Details page Action Routes
router.post("/:slug/post", createGroupPost);
router.delete("/:groupId/leave", leaveGroup);

// Admin Action Routes
router.delete("/:groupId/members/:userId", removeMember);
router.patch("/:groupId/members/:userId/assign-admin", assignAdmin);
router.patch("/:groupId/members/:userId/revoke-admin", revokeAdmin);

// ==========================================
// 🚀 POST & COMMENT ACTIONS
// ==========================================
router.post("/posts/:postId/like", toggleGroupPostLike);
router.post("/posts/:postId/read", toggleGroupPostRead);
router.delete("/posts/:postId", deleteGroupPost);
router.patch("/posts/:postId", updateGroupPost);

router.get("/posts/:postId/comments", getGroupPostComments);
router.post("/posts/:postId/comments", createGroupPostComment);
router.delete("/comments/:commentId", deleteGroupPostComment);
router.patch("/comments/:commentId", updateGroupPostComment);
router.post("/comments/:commentId/like", toggleGroupPostCommentLike);

export default router;
