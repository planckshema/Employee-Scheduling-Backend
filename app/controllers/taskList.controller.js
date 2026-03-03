import db from "../models/index.js";
import logger from "../config/logger.js";

const TaskList = db.taskList;
const exports = {};

const parseDescription = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return {
        description: parsed.description || "",
        items: Array.isArray(parsed.items) ? parsed.items : [],
      };
    }
  } catch (err) {
    // Ignore parse errors and use fallback shape
  }

  return { description: value || "", items: [] };
};

const toApi = (row) => {
  const decoded = parseDescription(row.description);
  return {
    taskListId: row.taskListId,
    name: row.task,
    description: decoded.description,
    items: decoded.items,
    date: row.updatedAt,
  };
};

exports.create = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).send({ message: "Task list name is required" });
  }

  const items = Array.isArray(req.body.items)
    ? req.body.items.map((item) => String(item).trim()).filter(Boolean)
    : [];

  try {
    const created = await TaskList.create({
      task: req.body.name,
      description: JSON.stringify({
        description: req.body.description || "",
        items,
      }),
    });

    return res.send(toApi(created));
  } catch (err) {
    logger.error(`Error creating task list: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error creating task list" });
  }
};

exports.findAll = async (_req, res) => {
  try {
    const rows = await TaskList.findAll({ order: [["taskListId", "DESC"]] });
    return res.send(rows.map(toApi));
  } catch (err) {
    logger.error(`Error retrieving task lists: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error retrieving task lists" });
  }
};

exports.update = async (req, res) => {
  const items = Array.isArray(req.body.items)
    ? req.body.items.map((item) => String(item).trim()).filter(Boolean)
    : [];

  try {
    const [updated] = await TaskList.update(
      {
        task: req.body.name,
        description: JSON.stringify({
          description: req.body.description || "",
          items,
        }),
      },
      { where: { taskListId: req.params.id } },
    );

    if (updated !== 1) {
      return res.status(404).send({ message: `Task list with id=${req.params.id} not found.` });
    }

    const row = await TaskList.findByPk(req.params.id);
    return res.send(toApi(row));
  } catch (err) {
    logger.error(`Error updating task list ${req.params.id}: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error updating task list" });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await TaskList.destroy({ where: { taskListId: req.params.id } });
    if (deleted !== 1) {
      return res.status(404).send({ message: `Task list with id=${req.params.id} not found.` });
    }
    return res.send({ message: "Task list deleted successfully." });
  } catch (err) {
    logger.error(`Error deleting task list ${req.params.id}: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error deleting task list" });
  }
};

export default exports;
