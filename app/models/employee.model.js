import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Employee = SequelizeInstance.define("employee", {
  
  EmployeeID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  phoneNum: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "",
  },
  school: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "",
  },
  schoolYear: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "",
  },
  major: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "",
  },
  studentId: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "",
  },

 }, 
  {
    timestamps: false,
  }
);

export default Employee;

