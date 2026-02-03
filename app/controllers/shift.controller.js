import db  from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const Op = db.Sequelize.Op;
const exports = {};


// This next code is only here to serve as an example for when we are ready to write code to query the database, can be deleted or modified


// Create and Save a new Tutorial
exports.create = (req, res) => {
  // Validate request
  if (!req.body.title) {
    logger.warn('Tutorial creation attempt with empty title');
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }
  // Create a Tutorial
  const tutorial = {
    title: req.body.title,
    description: req.body.description,
    published: req.body.published ? req.body.published : false,
    userId: req.body.userId,
  };
  
  logger.debug(`Creating tutorial: ${tutorial.title} for user: ${tutorial.userId}`);
  
  // Save Tutorial in the database
  Tutorial.create(tutorial)
    .then((data) => {
      logger.info(`Tutorial created successfully: ${data.id} - ${data.title}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating tutorial: ${err.message}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Tutorial.",
      });
    });
};
