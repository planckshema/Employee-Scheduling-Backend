import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import TaskStatus from "./taskStatus.model.js";
import ShiftSwapRequest from "./shiftSwapRequest.model.js";
import Shift from "./shift.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.taskStatus = TaskStatus;
db.shiftSwapRequest = ShiftSwapRequest;
db.shift = Shift;

export default db;
