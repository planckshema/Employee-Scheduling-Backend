import templateShift from "../controllers/templateShift.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

// Update a specific shift within a template
router.put("/:id", [authenticate], templateShift.update);

// Delete a specific shift from a template
router.delete("/:id", [authenticate], templateShift.delete);

export default router;