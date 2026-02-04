import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import ShiftSwapRequestRoutes from "./shiftSwapRequest.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/shiftSwapRequests", ShiftSwapRequestRoutes);


export default router;
