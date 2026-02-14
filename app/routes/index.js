import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import PositionRoutes from "./position.routes.js";
import ScheduleRoutes from "./schedule.routes.js";
import ClockInRoutes from "./clockInTime.routes.js";
import ClockOutRoutes from "./clockOutTime.routes.js";
import TaskLists from "./taskList.routes.js";
import UserRoutes from "./user.routes.js";
import EmployerRoutes from "./employer.routes.js";
import EmployeeRoutes from "./employee.routes.js";
import EmployeeAvailabilityRoutes from "./employeeAvailability.routes.js";
import TaskListItemRoutes from "./taskListItem.routes.js";
import TaskStatus from "./taskStatus.routes.js";
import ShiftSwapRequestRoutes from "./shiftSwapRequest.routes.js";
import ShiftRoutes from "./shift.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/positions", Positions);
router.use("/schedules", ScheduleRoutes);
router.use("/clockInTimes", ClockInRoutes);
router.use("/clockOutTimes", ClockOutRoutes);
router.use("/taskLists", TaskLists);
router.use("/users", UserRoutes);
router.use("/employers", EmployerRoutes);
router.use("/employee", EmployeeRoutesRoutes);
router.use("/employeeAvailabilities", EmployeeAvailabilityRoutes);
router.use("/taskListItems", TaskListItemRoutes);
router.use("/taskStatus", TaskStatus);
router.use("/shiftSwapRequests", ShiftSwapRequestRoutes);
router.use("/shifts", ShiftRoutes);

export default router;
