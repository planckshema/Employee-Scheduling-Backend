import db from "../models/index.js";
import logger from "../config/logger.js";

const Template = db.template;
const TemplateShift = db.templateShift;
const exports = {};

// Create and Save a new Template with its shifts
exports.create = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).send({ message: "Template name cannot be empty!" });
  }

  const trimmedDescription = String(req.body.description || "").trim();
  const trimmedName = String(req.body.name || "").trim();
  const existingTemplate = await Template.findOne({
    where: trimmedDescription
      ? { description: trimmedDescription }
      : { name: trimmedName },
  });

  if (existingTemplate) {
    return res.status(409).send({
      message: `This week is already saved as "${existingTemplate.name}". Delete that template first if you want to save it again.`,
    });
  }

  // Use a transaction to ensure both Template and Shifts save together
  const transaction = await db.sequelize.transaction();

  try {
    // 1. Create the Template Header
    const template = await Template.create({
      name: req.body.name,
      description: req.body.description
    }, { transaction });

    // 2. If there are shifts, add the new templateId to them and bulk create
    if (req.body.shifts && req.body.shifts.length > 0) {
      const shiftsWithId = req.body.shifts.map(shift => ({
        ...shift,
        templateId: template.id
      }));
      await TemplateShift.bulkCreate(shiftsWithId, { transaction });
    }

    await transaction.commit();
    logger.info(`Template '${template.name}' created with ${req.body.shifts?.length || 0} shifts.`);
    res.send(template);

  } catch (err) {
    await transaction.rollback();
    logger.error(`Template creation failed: ${err.message}`);
    res.status(500).send({ message: err.message || "Error creating template." });
  }
};

// Retrieve all Templates (including their shifts)
exports.findAll = (req, res) => {
  Template.findAll({ include: ["shifts"] })
    .then(data => res.send(data))
    .catch(err => {
      logger.error(`Error fetching templates: ${err.message}`);
      res.status(500).send({ message: "Error retrieving templates." });
    });
};

// Find a single Template by ID
exports.findOne = (req, res) => {
  const id = req.params.id;
  Template.findByPk(id, { include: ["shifts"] })
    .then(data => {
      if (data) res.send(data);
      else res.status(404).send({ message: "Template not found." });
    })
    .catch(err => res.status(500).send({ message: "Error retrieving template." }));
};

// Delete a Template (Shifts will auto-delete due to CASCADE)
exports.delete = (req, res) => {
  const id = req.params.id;
  Template.destroy({ where: { id: id } })
    .then(num => {
      if (num == 1) res.send({ message: "Template deleted successfully!" });
      else res.send({ message: "Template not found." });
    })
    .catch(err => res.status(500).send({ message: "Could not delete template." }));
};

export default exports;
