import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleFollow } from "../controllers/follow.controllers.js";

const router = Router();

router.use(verifyJWT);

// Unified route for toggle follow/unfollow
router.post("/:targetId", toggleFollow);

export default router;
