import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TradeRequestShift = SequelizeInstance.define("tradeRequestShift", {
  TradeRequestID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // Foreign Key to the actual Shift being traded
  ShiftID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  // The person currently assigned to the shift (null if it's an Employer Post)
  OriginalOwnerID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  // The person who wants to take the shift
  RequesterID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  postType: {
    type: Sequelize.ENUM('Employee Drop', 'Employer Post'),
    defaultValue: 'Employee Drop',
  },
  status: {
    type: Sequelize.ENUM('Available', 'Pending', 'Approved', 'Denied'),
    defaultValue: 'Available',
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  postedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
}, 
{
  timestamps: false,
}
);

export default TradeRequestShift;