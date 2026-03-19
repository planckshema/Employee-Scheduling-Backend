import template from "../controllers/template.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

// Create a new Template (including its shifts)
router.post("/", [authenticate], template.create);

// Retrieve all Templates (headers only, for the list)
router.get("/", [authenticate], template.findAll);

// Retrieve a single Template with all its associated shifts
router.get("/:id", [authenticate], template.findOne);

// Update a Template name or its shifts
//router.put("/:id", [authenticate], template.update);

// Delete a Template and all its shifts (Cascade)
router.delete("/:id", [authenticate], template.delete);

export default router;