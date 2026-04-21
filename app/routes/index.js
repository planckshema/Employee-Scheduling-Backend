import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import TimeOffRoutes from "./timeOff.routes.js";
import NotificationRoutes from "./notification.routes.js";
import BusinessArea from "./businessArea.routes.js";
import EmployeePosition from "./employeePosition.routes.js";
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
import TemplateRoutes from "./template.routes.js";
import TemplateShiftRoutes from "./templateShift.routes.js";
import TradeRequestShiftRoutes from "./tradeRequestShift.routes.js";
import SchoolRoutes from "./school.routes.js";
import AdminRoutes from "./admin.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/timeOff", TimeOffRoutes);
router.use("/notifications", NotificationRoutes);
router.use("/businessArea", BusinessArea);
router.use("/employeePositions", EmployeePosition);
router.use("/positions", PositionRoutes);
router.use("/schedules", ScheduleRoutes);
router.use("/clockInTimes", ClockInRoutes);
router.use("/clockOutTimes", ClockOutRoutes);
router.use("/taskLists", TaskLists);
router.use("/users", UserRoutes);
router.use("/employers", EmployerRoutes);
router.use("/employee", EmployeeRoutes);
router.use("/employeeAvailabilities", EmployeeAvailabilityRoutes);
router.use("/taskListItems", TaskListItemRoutes);
router.use("/taskStatus", TaskStatus);
router.use("/shiftSwapRequests", ShiftSwapRequestRoutes);
router.use("/shifts", ShiftRoutes);
router.use("/templates", TemplateRoutes);
router.use("/templateShifts", TemplateShiftRoutes);
router.use("/tradeRequestShifts", TradeRequestShiftRoutes);
router.use("/school", SchoolRoutes);
router.use("/admin", AdminRoutes);


export default router;
