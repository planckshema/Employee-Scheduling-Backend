import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import Employee from "./employee.model.js";
import EmployeeAvailability from "./employeeAvailability.model.js";
import TaskListItem from "./taskListItem.model.js";
import TaskStatus from "./taskStatus.model.js";
import ShiftSwapRequest from "./shiftSwapRequest.model.js";
import Shift from "./shift.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.employee = Employee;
db.employeeAvailability = EmployeeAvailability;
db.taskListItem = TaskListItem;
db.taskStatus = TaskStatus;
db.shiftSwapRequest = ShiftSwapRequest;
db.shift = Shift;

export default db;
