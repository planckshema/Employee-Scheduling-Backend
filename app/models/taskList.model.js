import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TaskList = SequelizeInstance.define("taskList", {
  
  taskListId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  task: {
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

export default TaskList;

