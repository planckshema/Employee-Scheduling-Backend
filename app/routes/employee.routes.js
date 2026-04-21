import employee from "../controllers/employee.controller.js";
import school from "../controllers/school.controller.js";
import { Router } from "express";

var router = Router();

router.post("/", employee.create);
router.get("/", employee.findAll);
router.get("/availability-index", employee.getAvailabilityIndex);
router.get("/profile/users/:userId", employee.getProfile);
router.post("/profile/users/:userId", employee.createProfile);
router.get("/dashboard/users/:userId", employee.getDashboard);
router.put("/dashboard/users/:userId/availability", employee.updateAvailability);
router.get("/merged-availability/:userId", school.getMergedAvailability);
router.get("/:id", employee.findOne);
router.put("/:id", employee.update);
router.delete("/:id", employee.delete);
router.get("/dashboard/users/:userId/today-shift", employee.getTodayShift);
router.get("/dashboard/users/:userId/timeclock/:shiftId", employee.getTimeClockStatus);
router.post("/dashboard/users/:userId/timeclock/:shiftId/clock-in", employee.clockIn);
router.post("/dashboard/users/:userId/timeclock/:shiftId/clock-out", employee.clockOut);

export default router;
