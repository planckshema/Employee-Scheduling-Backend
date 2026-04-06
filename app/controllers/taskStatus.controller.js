import db from "../models/index.js";
import logger from "../config/logger.js";

const TaskStatus = db.taskStatus;
const exports = {};

// Create and save a new task status
exports.create = (req, res) => {
  if (!req.body.status || !req.body.dateTime) {
    logger.warn("Task status creation attempt with missing required fields");
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }

  const taskStatus = {
    status: req.body.status,
    dateTime: req.body.dateTime,
  };

  TaskStatus.create(taskStatus)
    .then((data) => {
      logger.info(`Task status created successfully: ${data.taskStatusId}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating task status: ${err.message}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Task Status.",
      });
    });
};

export default exports;
