import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TemplateShift = SequelizeInstance.define("templateShift", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  templateId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'templates', // name of Target model
      key: 'id',          // key in Target model that we're referencing
    },
    onDelete: 'CASCADE',
  },
  EmployeeID: {
    type: Sequelize.INTEGER,
    allowNull: true, // Can be null if the template is for "Unassigned" slots
  },
  position: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "Staff",
  },
  startTime: {
    type: Sequelize.TIME,
    allowNull: false,
  },
  endTime: {
    type: Sequelize.TIME,
    allowNull: false,
  },
  dayOfWeek: {
    type: Sequelize.INTEGER,
    allowNull: false, // 0 = Sunday, 1 = Monday, etc.
  },
}, {
  timestamps: false,
});

export default TemplateShift;