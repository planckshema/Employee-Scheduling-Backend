import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import TimeOffRoutes from "./timeOff.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/timeOff", TimeoffRoutes);


export default router;
