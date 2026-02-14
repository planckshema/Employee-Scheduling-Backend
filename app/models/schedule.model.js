import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Schedule = SequelizeInstance.define("schedule", {
  
  scheduleId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nameOfSchedule: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  templateType: {
    type: Sequelize.STRING,
  },
  startDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
});

export default User;

