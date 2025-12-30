import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPost } from "../controllers/post.controllers.js";

const router = Router();

// All post routes require authentication
router.use(verifyJWT);

// POST /api/v1/posts
router.post("/", createPost);

export default router;
