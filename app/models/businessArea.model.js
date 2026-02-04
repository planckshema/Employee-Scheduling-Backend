import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const BusinessArea = SequelizeInstance.define("businessArea", {
  
  AreaId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  Name: {
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

export default BusinessArea;

