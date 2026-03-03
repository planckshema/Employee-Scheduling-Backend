import db from "../models/index.js";
import logger from "../config/logger.js";

const Employee = db.employee;
const Op = db.Sequelize.Op;
const exports = {};

exports.create = async (req, res) => {
  if (!req.body.firstName || !req.body.lastName || !req.body.email) {
    return res.status(400).send({ message: "firstName, lastName, and email are required" });
  }

  try {
    const employee = await Employee.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNum: req.body.phoneNum || "",
    });

    logger.info(`Employee created successfully: ${employee.EmployeeID}`);
    return res.send(employee);
  } catch (err) {
    logger.error(`Error creating employee: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the Employee.",
    });
  }
};

exports.findAll = async (req, res) => {
  const search = req.query.search;
  const condition = search
    ? {
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      }
    : undefined;

  try {
    const employees = await Employee.findAll({ where: condition, order: [["EmployeeID", "DESC"]] });
    return res.send(employees);
  } catch (err) {
    logger.error(`Error retrieving employees: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving employees.",
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).send({ message: `Employee with id=${req.params.id} not found.` });
    }
    return res.send(employee);
  } catch (err) {
    logger.error(`Error retrieving employee ${req.params.id}: ${err.message}`);
    return res.status(500).send({ message: "Error retrieving employee." });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Employee.update(
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNum: req.body.phoneNum,
      },
      { where: { EmployeeID: req.params.id } },
    );

    if (updated !== 1) {
      return res.status(404).send({ message: `Cannot update Employee with id=${req.params.id}.` });
    }

    const employee = await Employee.findByPk(req.params.id);
    return res.send(employee);
  } catch (err) {
    logger.error(`Error updating employee ${req.params.id}: ${err.message}`);
    return res.status(500).send({ message: "Error updating employee." });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Employee.destroy({ where: { EmployeeID: req.params.id } });
    if (deleted !== 1) {
      return res.status(404).send({ message: `Cannot delete Employee with id=${req.params.id}.` });
    }
    return res.send({ message: "Employee deleted successfully." });
  } catch (err) {
    logger.error(`Error deleting employee ${req.params.id}: ${err.message}`);
    return res.status(500).send({ message: "Error deleting employee." });
  }
};

export default exports;
