import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ShiftSwapRequest = SequelizeInstance.define("shiftSwapRequest", {
  
  swapRequestId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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

export default User;

