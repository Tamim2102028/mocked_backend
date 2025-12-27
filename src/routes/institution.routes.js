import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getInstitutionFeed,
  createInstitutionPost,
  getInstitutionDetails,
  getDepartmentsList,
  toggleInstitutionFollow,
} from "../controllers/institution.controllers.js";

const router = Router();
router.use(verifyJWT);

router.post("/:instId/follow", toggleInstitutionFollow);
router.get("/:instId", getInstitutionDetails);
router.get("/:instId/feed", getInstitutionFeed);
router.get("/:instId/departments", getDepartmentsList);
router.post("/:instId/post", createInstitutionPost);

export default router;
