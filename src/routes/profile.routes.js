import { Router } from "express";

// Middlewares
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../middlewares/multer.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

// Validators
import { userOnboardingSchema } from "../validators/auth.validator.js";

// Controllers
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
  toggleProfileFollow,
  getUserProfileHeader,
  getUserDetails,
  updateAccountDetails,
  updateAcademicProfile,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/profile.controllers.js";

const router = Router();

// All profile routes require authenticated user (router-level)
router.use(verifyJWT);

// GET /profile/:username
router.get("/:username", getUserProfileHeader);

// GET /profile/details/:username
router.get("/details/:username", getUserDetails);

// Follow / Unfollow a user
router.post("/:userId/follow", toggleProfileFollow);

// update general details
router.patch("/update-general", updateAccountDetails);

// update academic profile
router.patch(
  "/update-academic",
  validate(userOnboardingSchema),
  updateAcademicProfile
);

// update avatar
router.patch("/avatar", uploadImage.single("avatar"), updateUserAvatar);

// update cover image
router.patch(
  "/cover-image",
  uploadImage.single("coverImage"),
  updateUserCoverImage
);

// get profile posts
router.get("/:username/posts", getUserProfilePosts);

// create profile post
router.post("/post", createProfilePost);

// ================================
// Post actions
// ================================
// like / unlike
router.post("/posts/:postId/like", toggleProfilePostLike);
// mark as read / unread
router.post("/posts/:postId/read", toggleProfilePostRead);
// delete post
router.delete("/posts/:postId", deleteProfilePost);
// update post
router.patch("/posts/:postId", updateProfilePost);

// ================================
// Post Comments
// ================================
// get comments for a post
router.get("/posts/:postId/comments", getProfilePostComments);
// create comment for a post
router.post("/posts/:postId/comments", createProfilePostComment);
// delete comment
router.delete("/comments/:commentId", deleteProfilePostComment);
// update comment
router.patch("/comments/:commentId", updateProfilePostComment);
// like / unlike comment
router.post("/comments/:commentId/like", toggleProfilePostCommentLike);

export default router;
