import db from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new Shift
exports.create = (req, res) => {
  // Validate request (using day or startTime as a required field)
  if (!req.body.startTime || !req.body.startDate) {
    logger.warn('Shift creation attempt with missing time/date');
    res.status(400).send({
      message: "Shift startTime and startDate cannot be empty!",
    });
    return;
  }

  // Create a Shift object based on your model
  const shift = {
    day: req.body.day,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    startDate: req.body.startDate
  };

  logger.debug(`Creating shift for day: ${shift.day} starting at: ${shift.startTime}`);

  // Save Shift in the database
  Shift.create(shift)
    .then((data) => {
      logger.info(`Shift created successfully: ID ${data.shiftId}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating shift: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Shift.",
      });
    });
};

// Retrieve all Shifts from the database (This is what your Dashboard uses)
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

export default exports;