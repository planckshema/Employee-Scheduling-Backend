import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Shift = SequelizeInstance.define("shift", {
    shiftId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    day: {
        type: Sequelize.STRING,
    },
    startTime: {
        type: Sequelize.DATE,
        allownull: false
    },
    endTime: {
        type: Sequelize.DATE,
        allownull: false,
    },
    startDate: {
        type: Sequelize.DATE,
        allownull: false,
    },
});

export default Shift;
