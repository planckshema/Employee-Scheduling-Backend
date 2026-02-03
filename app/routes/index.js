import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import ShiftRoutes from "./shift.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/shifts", ShiftRoutes);

export default router;
