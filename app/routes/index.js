import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import TaskStatus from "./taskStatus.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/taskStatus", TaskStatus);


export default router;
