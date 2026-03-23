import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Shift = SequelizeInstance.define("shift", {
    shiftId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    EmployeeID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'EmployeeID' // Ensures it matches the exact column name in MySQL
    },
    day: {
        type: Sequelize.STRING,
    },
    startTime: {
        type: Sequelize.TIME, // LEAVE AS IS since it's working
        allowNull: false
    },
    endTime: {
        type: Sequelize.TIME, // LEAVE AS IS since it's working
        allowNull: false,
    },
    startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
},
    {
        timestamps: false,
        underscored: false, // Prevents Sequelize from trying to find 'employee_id'
        freezeTableName: false
    }
);

export default Shift;