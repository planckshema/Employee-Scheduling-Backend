import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import ClockInRoutes from "./clockInTime.routes.js";
import ClockOutRoutes from "./clockOutTime.routes.js";

const router = Router();

router.use("/", AuthRoutes);
router.use("/clockInTimes", ClockInRoutes);
router.use("/clockOutTimes", ClockOutRoutes);

export default router;
