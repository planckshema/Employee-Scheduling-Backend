import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ClockOutTime = SequelizeInstance.define("clockOutTime", {
  
  clockOutId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dateTime: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  endTime: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  day: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  // refresh_token: {
  //   type: Sequelize.STRING(512),
  //   allowNull: true
  // },
  // expiration_date: {
  //   type: Sequelize.DATE,
  //   allowNull: true
  // },
});

export default ClockOutTime;

