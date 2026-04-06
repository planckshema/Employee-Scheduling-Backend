import employee from "../controllers/employee.controller.js";
import { Router } from "express";

var router = Router();

router.post("/", employee.create);
router.get("/", employee.findAll);
router.get("/availability-index", employee.getAvailabilityIndex);
router.get("/profile/users/:userId", employee.getProfile);
router.post("/profile/users/:userId", employee.createProfile);
router.get("/dashboard/users/:userId", employee.getDashboard);
router.put("/dashboard/users/:userId/availability", employee.updateAvailability);
router.get("/:id", employee.findOne);
router.put("/:id", employee.update);
router.delete("/:id", employee.delete);

export default router;
