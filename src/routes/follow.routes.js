import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  followUser,
  unfollowUser,
} from "../controllers/follow.controllers.js";

const router = Router();

router.use(verifyJWT);

router.post("/:userId", followUser);
router.delete("/:userId", unfollowUser);

export default router;
