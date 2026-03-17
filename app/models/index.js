import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import TimeOff from "./timeOff.model.js";
import Notification from "./notification.model.js";
import BusinessArea from "./businessArea.model.js";
import EmployeePosition from "./employeePosition.model.js";
import Position from "./position.models.js";
import Schedule from "./schedule.model.js";
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

db.timeOff = TimeOff;
db.notification = Notification;
db.businessArea = BusinessArea;
db.employeePosition = EmployeePosition;
db.position = Position;
db.schedule = Schedule;
db.clockInTime = ClockInTime;
db.clockOutTime = ClockOutTime;
db.taskList = TaskList;
db.user = User;
db.session = Session;
db.employer = Employer;
db.employee = Employee;
db.employeeAvailability = EmployeeAvailability;
db.taskListItem = TaskListItem;
db.taskStatus = TaskStatus;
db.shiftSwapRequest = ShiftSwapRequest;
db.shift = Shift;


// --- Relationships / Associations ---

// 1. Employee & User (One-to-One)
db.user.belongsTo(db.employee, { foreignKey: 'EmployeeID' });
db.employee.hasOne(db.user, { foreignKey: 'EmployeeID' });

// 2. Employer & BusinessArea (One-to-Many)
db.employer.hasMany(db.businessArea, { foreignKey: 'EmployerID' });
db.businessArea.belongsTo(db.employer, { foreignKey: 'EmployerID' });

// 3. BusinessArea & Positions (One-to-Many)
db.businessArea.hasMany(db.position, { foreignKey: 'AreaID' });
db.position.belongsTo(db.businessArea, { foreignKey: 'AreaID' });

// 4. BusinessArea & Schedule (One-to-Many)
db.businessArea.hasMany(db.schedule, { foreignKey: 'AreaID' });
db.schedule.belongsTo(db.businessArea, { foreignKey: 'AreaID' });

// 5. Employee & EmployeePosition (Many-to-Many via EmployeePosition)
db.employee.hasMany(db.employeePosition, { foreignKey: 'EmployeeID' });
db.employeePosition.belongsTo(db.employee, { foreignKey: 'EmployeeID' });
db.position.hasMany(db.employeePosition, { foreignKey: 'PositionID' });
db.employeePosition.belongsTo(db.position, { foreignKey: 'PositionID' });

// 6. Shift Relationships
// Shift belongs to Employee, Schedule, and TaskList
db.employee.hasMany(db.shift, { foreignKey: 'EmployeeID' });
db.shift.belongsTo(db.employee, { foreignKey: 'EmployeeID' });

db.schedule.hasMany(db.shift, { foreignKey: 'ScheduleID' });
db.shift.belongsTo(db.schedule, { foreignKey: 'ScheduleID' });

db.taskList.hasMany(db.shift, { foreignKey: 'TaskListID' });
db.shift.belongsTo(db.taskList, { foreignKey: 'TaskListID' });

// 7. Clock In/Out & Shift
db.shift.hasMany(db.clockInTime, { foreignKey: 'ShiftID' });
db.clockInTime.belongsTo(db.shift, { foreignKey: 'ShiftID' });

db.shift.hasMany(db.clockOutTime, { foreignKey: 'ShiftID' });
db.clockOutTime.belongsTo(db.shift, { foreignKey: 'ShiftID' });

// 8. TimeOff & Availability
db.employee.hasMany(db.timeOff, { foreignKey: 'EmployeeID' });
db.timeOff.belongsTo(db.employee, { foreignKey: 'EmployeeID' });

db.employee.hasMany(db.employeeAvailability, { foreignKey: 'EmployeeID' });
db.employeeAvailability.belongsTo(db.employee, { foreignKey: 'EmployeeID' });

// 9. TaskList & TaskListItems
db.taskList.hasMany(db.taskListItem, { foreignKey: 'TaskListID' });
db.taskListItem.belongsTo(db.taskList, { foreignKey: 'TaskListID' });

// 10. Task Status Tracking
db.shift.hasMany(db.taskStatus, { foreignKey: 'ShiftID' });
db.taskStatus.belongsTo(db.shift, { foreignKey: 'ShiftID' });

db.taskListItem.hasMany(db.taskStatus, { foreignKey: 'TaskListItemID' });
db.taskStatus.belongsTo(db.taskListItem, { foreignKey: 'TaskListItemID' });

// 11. Shift Swap Requests
db.shift.hasMany(db.shiftSwapRequest, { foreignKey: 'ShiftID' });
db.shiftSwapRequest.belongsTo(db.shift, { foreignKey: 'ShiftID' });

// Links for Offering and Accepting Employees
db.employee.hasMany(db.shiftSwapRequest, { foreignKey: 'EmployeeOfferID', as: 'OfferedSwaps' });
db.employee.hasMany(db.shiftSwapRequest, { foreignKey: 'EmployeeAcceptID', as: 'AcceptedSwaps' });

export default db;
