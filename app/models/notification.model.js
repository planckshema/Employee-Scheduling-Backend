import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Notifications = SequelizeInstance.define("notifications", {
  
  NotificationId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  dateTime: {
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

export default Notifications;

