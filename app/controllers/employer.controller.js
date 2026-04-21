import db from "../models/index.js";
import logger from "../config/logger.js";

const Employer = db.employer;
const User = db.user;
const exports = {};

const extractEmployerPayload = (body) => ({
  firstName: body.firstName || body.fName || "",
  lastName: body.lastName || body.lName || "",
  email: body.email || "",
  businessName: body.businessName || "",
  niche: body.niche || "",
  location: body.location || "",
  phoneNum: body.phoneNum || "",
  operatingHours: body.operatingHours || "",
  description: body.description || "",
});

const findEmployerForUser = async (user) => {
  if (!user?.email) {
    return null;
  }

  return Employer.findOne({ where: { email: user.email } });
};

exports.create = async (req, res) => {
  const payload = extractEmployerPayload(req.body);

  if (!payload.firstName || !payload.lastName || !payload.email) {
    logger.warn("Employer creation attempt with missing required fields");
    return res.status(400).send({ message: "firstName, lastName, and email are required." });
  }

  try {
    const employer = await Employer.create(payload);
    logger.info(`Employer created successfully: ${employer.employerid}`);
    return res.status(201).send(employer);
  } catch (err) {
    logger.error(`Error creating employer: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the Employer.",
    });
  }
};

exports.getProfile = async (req, res) => {
  const userId = req.params.userId || req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${userId}.` });
    }

    const employer = await findEmployerForUser(user);
    if (!employer) {
      return res.status(404).send({ message: "Employer profile not found." });
    }

    return res.send(employer);
  } catch (err) {
    logger.error(`Error retrieving employer profile for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving the employer profile.",
    });
  }
};

exports.createProfile = async (req, res) => {
  const userId = req.params.userId || req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${userId}.` });
    }

    const existing = await findEmployerForUser(user);
    const payload = extractEmployerPayload({
      ...req.body,
      email: req.body.email || user.email,
      firstName: req.body.firstName || user.fName,
      lastName: req.body.lastName || user.lName,
    });

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.email ||
      !payload.businessName ||
      !payload.niche ||
      !payload.operatingHours
    ) {
      return res.status(400).send({
        message: "firstName, lastName, email, businessName, niche, and operatingHours are required.",
      });
    }

    let employer = existing;
    if (employer) {
      await Employer.update(payload, { where: { employerid: employer.employerid } });
      employer = await Employer.findByPk(employer.employerid);
    } else {
      employer = await Employer.create(payload);
    }

    return res.status(existing ? 200 : 201).send(employer);
  } catch (err) {
    logger.error(`Error saving employer profile for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while saving the employer profile.",
    });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.params.userId || req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${userId}.` });
    }

    const employer = await findEmployerForUser(user);
    if (!employer) {
      return res.status(404).send({ message: "Employer profile not found." });
    }

    const payload = extractEmployerPayload({
      ...employer.toJSON(),
      ...req.body,
      email: employer.email,
    });

    await Employer.update(payload, { where: { employerid: employer.employerid } });
    const updated = await Employer.findByPk(employer.employerid);
    return res.send(updated);
  } catch (err) {
    logger.error(`Error updating employer profile for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while updating the employer profile.",
    });
  }
};

exports.findAll = (req, res) => {
  Employer.findAll({
    include: [{
      model: db.employee, // Try changing 'staff' to 'employee'
      as: "staff"
    }]
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({ message: "Error retrieving employers" });
  });
};

// Add this to your existing employer.controller.js

exports.addEmployee = async (req, res) => {
  // 1. Get the userId from the request (sent from Employer Dashboard)
  const userId = req.params.userId || req.params.id;

  try {
    // 2. Find the Employer record that belongs to this logged-in User
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const employer = await findEmployerForUser(user);
    if (!employer) {
      return res.status(404).send({ 
        message: "You must complete your Employer profile before adding employees." 
      });
    }

    // 3. Create the Employee payload and FORCE the employerid link
    const employeePayload = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNum: req.body.phoneNum,
      // This is the magic link that fixes the NULL issue in your screenshot
      employerID: employer.employerid
    };

    // 4. Save to the database
    const newEmployee = await db.employee.create(employeePayload);
    
    logger.info(`Employee ${newEmployee.EmployeeID} auto-assigned to Employer ${employer.employerid}`);
    
    return res.status(201).send(newEmployee);
  } catch (err) {
    logger.error(`Error auto-assigning employee: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Error occurred while adding the employee."
    });
  }
};

export default exports;
