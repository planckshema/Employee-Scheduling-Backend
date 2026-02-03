import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import Schedule from "./schedule.modle.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.schedule = Schedule;



export default db;
