import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Admin = SequelizeInstance.define("admin", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  tableName: "admins",
  timestamps: false,
});

export default Admin;