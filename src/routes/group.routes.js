import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getGroupFeed,
  createGroupPost,
  createGroup,
  deleteGroup,
  inviteMembers,
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
  getGroupPinnedPosts,
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
router.get("/:slug/members", getGroupMembers);
router.get("/:slug/feed", getGroupFeed);
router.get("/:slug/pinned", getGroupPinnedPosts);

// Group Details page Action Routes
router.post("/:slug/post", createGroupPost);
router.delete("/:slug/leave", leaveGroup);
router.delete("/:slug", deleteGroup);
router.post("/:slug/invite", inviteMembers);

// Admin Action Routes
router.delete("/:slug/members/:userId", removeMember);
router.patch("/:slug/members/:userId/assign-admin", assignAdmin);
router.patch("/:slug/members/:userId/revoke-admin", revokeAdmin);

// ==========================================
// 🚀 POST & COMMENT ACTIONS
// ==========================================
// (Moved to unified post router)

// (Moved to dedicated comment namespace)

export default router;
