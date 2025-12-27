import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserProfilePosts } from "../controllers/profile.controllers.js";

const router = Router();

router.use(verifyJWT);

// ==========================================
// 🚀 PROFILE POSTS ROUTES
// ==========================================

// Get user profile posts
router.get("/:username/posts", getUserProfilePosts);

export default router;
