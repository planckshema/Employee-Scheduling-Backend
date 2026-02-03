import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
 
import Shift from "./shift.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.shift = Shift;

export default db;
