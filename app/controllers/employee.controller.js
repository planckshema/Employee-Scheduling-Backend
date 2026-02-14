import db  from "../models/index.js";
import logger from "../config/logger.js";

const Employee = db.user;
const Op = db.Sequelize.Op;
const exports = {};
// Create and Save a new Employee
exports.create = (req, res) => {
  // Validate request
  if (!req.body.fName) {
    logger.warn('Employee creation attempt with empty fName');
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a Employee
  const employee = {
    EmployeeID: req.body.id,
    firstName: req.body.fName,
    lastName: req.body.lName,
    email: req.body.email,
    phoneNum: req.body.email
    // refresh_token: req.body.refresh_token,
    // expiration_date: req.body.expiration_date
  };

  logger.debug(`Creating employee: ${employee.email}`);

  // Save Employee in the database
  Employee.create(employee)
    .then((data) => {
      logger.info(`User created successfully: ${data.EmployeeID} - ${data.email}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating user: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};

// Retrieve all People from the database.
exports.findAll = (req, res) => {
  const id = req.query.id;
  var condition = id ? { id: { [Op.like]: `%${id}%` } } : null;

  logger.debug(`Fetching all users with condition: ${JSON.stringify(condition)}`);

  Employee.findAll({ where: condition })
    .then((data) => {
      logger.info(`Retrieved ${data.length} employees`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving employees: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving people.",
      });
    });
};

// Find a single Employee with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding employee with id: ${EmployeeID}`);

  Employee.findByPk(EmployeeID)
    .then((data) => {
      if (data) {
        logger.info(`Employee found: ${EmployeeID}`);
        res.send(data);
      } else {
        logger.warn(`Employee not found with id: ${EmployeeID}`);
        res.status(404).send({
          message: `Cannot find Emplpoyee with id=${EmployeeID}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving user ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving User with id=" + EmployeeID,
      });
    });
};

// Find a single User with an email
exports.findByEmail = (req, res) => {
  const email = req.params.email;

  logger.debug(`Finding user with email: ${email}`);

  Employee.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data) {
        logger.info(`Employee found by email: ${email}`);
        res.send(data);
      } else {
        logger.warn(`Employee not found with email: ${email}`);
        res.send({ email: "not found" });
        
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving Employee by email ${email}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Employee with email=" + email,
      });
    });
};

// Update a User by the id in the request
exports.update = (req, res) => {
  const EmployeeID = req.params.EmployeeID;

  logger.debug(`Updating employee ${EmployeeID} with data: ${JSON.stringify(req.body)}`);

  EmployeeID.update(req.body, {
    where: { EmployeeID: EmployeeID},
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Employee ${EmployeeID} updated successfully`);
        res.send({
          message: "Employee was updated successfully.",
        });
      } else {
        logger.warn(`Failed to update user ${EmployeeID} - not found or empty body`);
        res.send({
          message: `Cannot update User with id=${EmployeeID}. Maybe Employee was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating user ${EmployeeID}: ${err.message}`);
      res.status(500).send({
        message: "Error updating User with id=" + EmployeeID,
      });
    });
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const EmployeeID = req.params.EmployeeID;

  logger.debug(`Attempting to delete user: ${EmployeeID}`);

  EmployeeID.destroy({
    where: { EmployeeID: EmployeeID},
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Employee ${EmployeeID} deleted successfully`);
        res.send({
          message: "Employee was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete employee ${EmployeeID} - not found`);
        res.send({
          message: `Cannot delete Employee with id=${EmployeeID}. Maybe Employee was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting employee ${EmployeeID}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete Employee with id=" + EmployeeID,
      });
    });
};


export default exports;
