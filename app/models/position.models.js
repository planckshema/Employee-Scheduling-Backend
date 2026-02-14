import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Position = SequelizeInstance.define("position", {
  
  PositionId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  positionName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  payrate: {
    type: Sequelize.STRING,
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

export default Position;

