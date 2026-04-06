import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const normalizeTimeValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return value;
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return value;
        }

        return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}:${String(value.getUTCSeconds()).padStart(2, "0")}`;
    }

    const match = String(value).match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
        return value;
    }

    return `${match[1]}:${match[2]}:${match[3] || "00"}`;
};

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
        allowNull: false,
        get() {
            return normalizeTimeValue(this.getDataValue("startTime"));
        },
        set(value) {
            this.setDataValue("startTime", normalizeTimeValue(value));
        },
    },
    endTime: {
        type: Sequelize.TIME, // LEAVE AS IS since it's working
        allowNull: false,
        get() {
            return normalizeTimeValue(this.getDataValue("endTime"));
        },
        set(value) {
            this.setDataValue("endTime", normalizeTimeValue(value));
        },
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
