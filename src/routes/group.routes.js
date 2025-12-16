import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getGroupFeed,
  createGroupPost,
  createGroup,
  getMyGroups,
  joinGroup,
  getGroupDetails,
} from "../controllers/group.controllers.js";

const router = Router();
router.use(verifyJWT);

// Global Group Routes
router.post("/", createGroup);
router.get("/my", getMyGroups);

// Specific Group Routes
router.get("/:groupId", getGroupDetails);
router.get("/:groupId/feed", getGroupFeed);
router.post("/:groupId/post", createGroupPost);
router.post("/:groupId/join", joinGroup);

export default router;
