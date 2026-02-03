import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import ScheduleRoutes from "./schedule.routes.js";

const router = Router();

router.use("/", AuthRoutes);
router.use("/schedules", ScheduleRoutes);

export default router;
