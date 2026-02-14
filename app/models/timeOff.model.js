import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TimeOff = SequelizeInstance.define("timeOff", {
  
  TimeOffId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  startDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  reasons: {
    type: Sequelize.STRING,
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

export default TimeOff;

