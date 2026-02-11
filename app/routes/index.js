import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import EmployeeAvailabilityRoutes from "./employeeAvailability.routes.js";
import TaskListItemRoutes from "./taskListItem.routes.js";
import TaskStatus from "./taskStatus.routes.js";
import ShiftSwapRequestRoutes from "./shiftSwapRequest.routes.js";
import ShiftRoutes from "./shift.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/employeeAvailabilities", EmployeeAvailabilityRoutes);
router.use("/taskListItems", TaskListItemRoutes);
router.use("/taskStatus", TaskStatus);
router.use("/shiftSwapRequests", ShiftSwapRequestRoutes);
router.use("/shifts", ShiftRoutes);

export default router;
