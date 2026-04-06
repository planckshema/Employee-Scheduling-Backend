import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Template = SequelizeInstance.define("template", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true, // Useful for sorting by "Last Created"
});

export default Template;