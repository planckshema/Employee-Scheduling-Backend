import employers from "../controllers/lesson.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()

// Create a new Employer
  router.post("/", [authenticate], employers.create);

export default router;