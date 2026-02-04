import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models
import Notification from "./notification.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.notification = Notification;


export default db;
