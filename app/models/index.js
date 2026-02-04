import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import ClockInTime from "./clockInTime.model.js";
import ClockOutTime from "./clockOutTime.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.clockInTime = ClockInTime;
db.clockOutTime = ClockOutTime;


export default db;
