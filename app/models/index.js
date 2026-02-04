import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import TaskStatus from "./taskStatus.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.taskStatus = TaskStatus;


export default db;
