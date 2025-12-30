import { Router } from "express";

// Controllers
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
} from "../../controllers/auth.controllers.js";

// Middlewares
import { uploadImage } from "../../middlewares/multer.middleware.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";

// Validators
import { userRegisterSchema } from "../../validators/auth.validator.js";

const router = Router();

// ==================================================
// 🔓 PUBLIC ROUTES (No Login Required)
// ==================================================

// Registration Route (With File Upload & Validation)
router.post(
  "/register",
  uploadImage.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validate(userRegisterSchema),
  registerUser
);

// Login Route
router.post("/login", loginUser);

// ==================================================
// 🔒 SECURED ROUTES (Login Required)
// ==================================================

// Logout Route
router.post("/logout", verifyJWT, logoutUser);

// Token Refresh Route
router.post("/refresh-token", refreshAccessToken);

// Change Current Password
router.post("/change-password", verifyJWT, changeCurrentPassword);

// Get Current User Info
router.get("/current-user", verifyJWT, getCurrentUser);

export default router;
