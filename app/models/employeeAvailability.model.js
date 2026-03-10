import sequelize from "../config/sequelizeInstance.js";
import { DataTypes } from "sequelize";

const EmployeeAvailability = sequelize.define("employeeAvailability", {
  availabilityText: {
    type: DataTypes.TEXT,
    allowNull: false
  }
 }, 
  {
    timestamps: false,
  }
);

export default EmployeeAvailability;
