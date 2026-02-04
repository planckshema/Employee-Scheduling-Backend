import db  from "../models/index.js";
import logger from "../config/logger.js";

const Position = db.position;
const Op = db.Sequelize.Op;
const exports = {};

// Code that can/will be chagned in the future
// Create and Save a new User
exports.create = (req, res) => {
  // Validate request
  if (!req.body.fName) {
    logger.warn('User creation attempt with empty fName');
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a User
  const user = {
    id: req.body.id,
    fName: req.body.fName,
    lName: req.body.lName,
    email: req.body.email,
    // refresh_token: req.body.refresh_token,
    // expiration_date: req.body.expiration_date
  };

  logger.debug(`Creating user: ${user.email}`);

  // Save User in the database
  User.create(user)
    .then((data) => {
      logger.info(`User created successfully: ${data.id} - ${data.email}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating user: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};


export default exports;
