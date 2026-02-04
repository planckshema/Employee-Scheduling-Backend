import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import TimeOff from "./timeOff.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.timeOff = TimeOff;


export default db;
