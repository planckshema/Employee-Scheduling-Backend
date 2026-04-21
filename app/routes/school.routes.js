import school from "../controllers/school.controller.js";
import { Router } from "express";

const router = Router();

// GET /api/school/classes/:studentId - Get class schedule for a student
router.get("/classes/:studentId", school.getClassSchedule);

// GET /api/school/current-term - Get current term information
router.get("/current-term", school.getCurrentTerm);

// POST /api/school/validate-student - Validate student ID
router.post("/validate-student", school.validateStudentId);

export default router;
