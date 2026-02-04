import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import EmployeePosition from "./employeePosition.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/employeePositions", EmployeePosition);

export default router;
