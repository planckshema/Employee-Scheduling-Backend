import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import ShiftSwapRequest from "./shiftSwapRequest.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.shiftSwapRequest = ShiftSwapRequest;


export default db;
