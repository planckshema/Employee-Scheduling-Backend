import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Employer = SequelizeInstance.define("employer", {
   employerid: {
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
     businessName:{
        type: Sequelize.STRING,
        allowNull: false,
     },
     location:{
        type: Sequelize.STRING,
        allowNull: false,
     },
     phoneNum:{
        type: Sequelize.STRING,
        allowNull: false,
     },
});

export default employer;