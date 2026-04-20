import timecards from "../controllers/timecard.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

router.get("/employers/:userId", [authenticate], timecards.findForEmployer);
router.get("/users/:userId", [authenticate], timecards.findForUser);
router.get("/users/:userId/shifts/:shiftId", [authenticate], timecards.findOneForUser);
router.get("/users/:userId/shifts/:shiftId/status", [authenticate], timecards.getStatus);
router.post("/users/:userId/shifts/:shiftId/clock-in", [authenticate], timecards.clockIn);
router.post("/users/:userId/shifts/:shiftId/clock-out", [authenticate], timecards.clockOut);

export default router;
