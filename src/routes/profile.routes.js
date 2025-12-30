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

// Follow / Unfollow (Moved to /follows)

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
// (Moved to unitifed post router)

// ================================
// Post Comments
// ================================
// Post Comments (Moved to /comments)

export default router;
