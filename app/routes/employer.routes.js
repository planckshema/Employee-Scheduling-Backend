import employers from "../controllers/employer.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

// Create a new Employer
router.post("/", [authenticate], employers.create);
router.get("/profile/users/:userId", [authenticate], employers.getProfile);
router.post("/profile/users/:userId", [authenticate], employers.createProfile);
router.put("/profile/users/:userId", [authenticate], employers.updateProfile);

export default router;
