import db from "../models/index.js";
import logger from "../config/logger.js";

const TemplateShift = db.templateShift;
const exports = {};

// Add a single shift to an existing template
exports.create = (req, res) => {
  if (!req.body.templateId) {
    return res.status(400).send({ message: "templateId is required!" });
  }

  TemplateShift.create(req.body)
    .then(data => res.send(data))
    .catch(err => res.status(500).send({ message: "Error adding shift to template." }));
};

// Update a specific shift in a template
exports.update = (req, res) => {
  const id = req.params.id;
  TemplateShift.update(req.body, { where: { id: id } })
    .then(num => {
      if (num == 1) res.send({ message: "Shift updated." });
      else res.send({ message: "Shift not found." });
    })
    .catch(err => res.status(500).send({ message: "Error updating shift." }));
};

// Delete a specific shift from a template
exports.delete = (req, res) => {
  const id = req.params.id;
  TemplateShift.destroy({ where: { id: id } })
    .then(num => {
      if (num == 1) res.send({ message: "Shift removed from template." });
      else res.send({ message: "Shift not found." });
    })
    .catch(err => res.status(500).send({ message: "Error deleting shift." }));
};

export default exports;