import timecards from "../controllers/timecard.controller.js";
import { Router } from "express";

var router = Router();

router.get("/employers/:userId", timecards.getEmployerTimecards);

export default router;
