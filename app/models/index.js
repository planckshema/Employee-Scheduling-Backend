import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import TaskListItem from "./taskListItem.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.taskListItem = TaskListItem;


export default db;
