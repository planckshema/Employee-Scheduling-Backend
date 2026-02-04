import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import Position from "./position.models.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.position = Position;


export default db;