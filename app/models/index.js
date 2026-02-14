import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import BusinessArea from "./businessArea.model.js";
import EmployeePosition from "./employeePosition.model.js";
import Position from "./position.models.js";
import Schedule from "./schedule.modle.js";
import ClockInTime from "./clockInTime.model.js";
import ClockOutTime from "./clockOutTime.model.js";
import User from "./user.model.js";
import Session from "./session.model.js";
import Employer from "./employer.model.js";
import TaskList from "./taskList.model.js";
import Employee from "./employee.model.js";
import EmployeeAvailability from "./employeeAvailability.model.js";
import TaskListItem from "./taskListItem.model.js";
import TaskStatus from "./taskStatus.model.js";
import ShiftSwapRequest from "./shiftSwapRequest.model.js";
import Shift from "./shift.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.businessArea = BusinessArea;
db.employeePosition = EmployeePosition;
db.position = Position;
db.schedule = Schedule;
db.clockInTime = ClockInTime;
db.clockOutTime = ClockOutTime;
db.taskList = TaskList;
db.user = User;
db.session = Session;
db.tutorial = Tutorial;
db.lesson = Lesson;
db.employer = Employer;
db.employee = Employee;
db.employeeAvailability = EmployeeAvailability;
db.taskListItem = TaskListItem;
db.taskStatus = TaskStatus;
db.shiftSwapRequest = ShiftSwapRequest;
db.shift = Shift;

export default db;
