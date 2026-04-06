import taskStatus from "../controllers/taskStatus.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

// Create a new Task Status
router.post("/", [authenticate], taskStatus.create);

export default router;
