import employee from "../controllers/employee.controller.js";
import timecards from "../controllers/timecard.controller.js";
import { Router } from "express";

var router = Router();

router.post("/", employee.create);
router.get("/", employee.findAll);
router.get("/availability-index", employee.getAvailabilityIndex);
router.get("/profile/users/:userId", employee.getProfile);
router.post("/profile/users/:userId", employee.createProfile);
router.get("/dashboard/users/:userId", employee.getDashboard);
router.put("/dashboard/users/:userId/availability", employee.updateAvailability);
router.get("/dashboard/users/:userId/timecards", timecards.findForUser);
router.get("/dashboard/users/:userId/timecards/:shiftId", timecards.findOneForUser);
router.get("/dashboard/users/:userId/timeclock/:shiftId", timecards.getStatus);
router.post("/dashboard/users/:userId/timeclock/:shiftId/clock-in", timecards.clockIn);
router.post("/dashboard/users/:userId/timeclock/:shiftId/clock-out", timecards.clockOut);
router.get("/dashboard/users/:userId/today-shift", employee.getTodayShift);
router.get("/timeclock/users/:userId/shift/today", employee.getTodayShift);
router.get("/timeclock/users/:userId/shifts/:shiftId", timecards.getStatus);
router.post("/timeclock/users/:userId/shifts/:shiftId/clock-in", timecards.clockIn);
router.post("/timeclock/users/:userId/shifts/:shiftId/clock-out", timecards.clockOut);
router.get("/:id", employee.findOne);
router.put("/:id", employee.update);
router.delete("/:id", employee.delete);

export default router;
