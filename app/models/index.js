import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import TaskList from "./taskList.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.taskList = TaskList;


export default db;
