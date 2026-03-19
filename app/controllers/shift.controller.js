import db from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new Shift
exports.create = (req, res) => {
  // Validate request
  if (!req.body.startTime || !req.body.startDate) {
    logger.warn('Shift creation attempt with missing time/date');
    return res.status(400).send({
      message: "Shift startTime and startDate cannot be empty!",
    });
  }

  // 1. Generate the Day Name from the startDate string
  // This ensures the 'day' column in your DB is populated (e.g., "Saturday")
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateObj = new Date(req.body.startDate + 'T00:00:00');
  const dayName = days[dateObj.getDay()];

  // 2. Map the incoming request to your Sequelize Model attributes
  // Ensure 'EmployeeID' casing matches your models/shift.model.js exactly
  const shift = {
    EmployeeID: req.body.EmployeeID,
    startDate: req.body.startDate,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    position: req.body.position || "Staff",
    day: dayName
  };

  console.log("3. Mapping to Model for Save:", shift);

  // 3. Save Shift in the database
  Shift.create(shift)
    .then((data) => {
      logger.info(`Shift created successfully: ID ${data.shiftId}`);
      // Explicitly send a 201 Created status
      res.status(201).send(data);
    })
    .catch((err) => {
      logger.error(`Error creating shift: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Shift.",
      });
    });
};

// Retrieve all Shifts from the database
exports.findAll = (req, res) => {
  logger.debug("Fetching all shifts for the dashboard");

  Shift.findAll()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving shifts: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving shifts.",
      });
    });
};

// Delete a Shift from the database
exports.delete = (req, res) => {
  const id = req.params.id;

  Shift.destroy({
    where: { shiftId: id } // Make sure 'shiftId' matches your model's PK
  })
    .then(num => {
      if (num == 1) {
        res.send({ message: "Shift was deleted successfully!" });
      } else {
        res.send({ message: `Cannot delete Shift with id=${id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Could not delete Shift with id=" + id });
    });
};

export default exports;