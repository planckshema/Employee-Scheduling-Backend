import db from "../models/index.js";
import logger from "../config/logger.js";

const Employer = db.employer;
const exports = {};

// Create and save a new employer
exports.create = (req, res) => {
  if (!req.body.firstName || !req.body.lastName || !req.body.email) {
    logger.warn("Employer creation attempt with missing required fields");
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }

  const employer = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    businessName: req.body.businessName,
    location: req.body.location,
    phoneNum: req.body.phoneNum,
  };

  Employer.create(employer)
    .then((data) => {
      logger.info(`Employer created successfully: ${data.employerid}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating employer: ${err.message}`);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Employer.",
      });
    });
};

export default exports;
