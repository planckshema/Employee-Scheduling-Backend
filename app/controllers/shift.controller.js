import db from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const exports = {};

const parseLocalDate = (dateValue) => {
  if (!dateValue || typeof dateValue !== "string") {
    return null;
  }
  const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, monthIndex, day, 0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateTime = (dateValue, timeValue) => {
  const localDate = parseLocalDate(dateValue);
  if (!localDate || !timeValue) {
    return null;
  }
  const [hours, minutes, secondsRaw] = timeValue.split(":");
  const h = Number(hours);
  const m = Number(minutes);
  const s = Number(secondsRaw || "0");
  if ([h, m, s].some((value) => Number.isNaN(value))) {
    return null;
  }
  const parsed = new Date(localDate);
  parsed.setHours(h, m, s, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTime = (dateObj) => {
  const date = new Date(dateObj);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const parseDayMeta = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    // Ignore parse errors and return fallback
  }
  return { label: value || "", employeeName: "", position: "", dayKey: "" };
};

const toApi = (row) => {
  const meta = parseDayMeta(row.day);
  return {
    shiftId: row.shiftId,
    dayKey: meta.dayKey || "",
    employeeName: meta.employeeName || "",
    position: meta.position || "",
    taskListId: meta.taskListId || null,
    date: row.startDate,
    startTime: formatTime(row.startTime),
    endTime: formatTime(row.endTime),
  };
};

exports.create = async (req, res) => {
  const { employeeName, position, date, startTime, endTime, taskListId } = req.body;

  if (!employeeName || !date || !startTime || !endTime) {
    return res
      .status(400)
      .send({ message: "employeeName, date, startTime, and endTime are required" });
  }

  const startTimeValue = toDateTime(date, startTime);
  const endTimeValue = toDateTime(date, endTime);
  const dateValue = parseLocalDate(date);

  if (!startTimeValue || !endTimeValue || !dateValue || Number.isNaN(dateValue.getTime())) {
    return res.status(400).send({ message: "Invalid date or time format" });
  }

  const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dateValue.getDay()];

  try {
    const created = await Shift.create({
      day: JSON.stringify({ dayKey, employeeName, position: position || "", taskListId: taskListId || null }),
      startTime: startTimeValue,
      endTime: endTimeValue,
      startDate: dateValue,
    });

    return res.send(toApi(created));
  } catch (err) {
    logger.error(`Error creating shift: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error creating shift" });
  }
};

exports.findAll = async (_req, res) => {
  try {
    const rows = await Shift.findAll({ order: [["startDate", "ASC"], ["startTime", "ASC"]] });
    return res.send(rows.map(toApi));
  } catch (err) {
    logger.error(`Error retrieving shifts: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error retrieving shifts" });
  }
};

exports.update = async (req, res) => {
  const { employeeName, position, date, startTime, endTime, taskListId } = req.body;
  const startTimeValue = toDateTime(date, startTime);
  const endTimeValue = toDateTime(date, endTime);
  const dateValue = parseLocalDate(date);

  if (!employeeName || !startTimeValue || !endTimeValue || !dateValue || Number.isNaN(dateValue.getTime())) {
    return res.status(400).send({ message: "Invalid shift payload" });
  }

  const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dateValue.getDay()];

  try {
    const [updated] = await Shift.update(
      {
        day: JSON.stringify({ dayKey, employeeName, position: position || "", taskListId: taskListId || null }),
        startTime: startTimeValue,
        endTime: endTimeValue,
        startDate: dateValue,
      },
      { where: { shiftId: req.params.id } },
    );

    if (updated !== 1) {
      return res.status(404).send({ message: `Shift with id=${req.params.id} not found.` });
    }

    const row = await Shift.findByPk(req.params.id);
    return res.send(toApi(row));
  } catch (err) {
    logger.error(`Error updating shift ${req.params.id}: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error updating shift" });
  }
};

exports.delete = async (req, res) => {
  try {
    const deleted = await Shift.destroy({ where: { shiftId: req.params.id } });
    if (deleted !== 1) {
      return res.status(404).send({ message: `Shift with id=${req.params.id} not found.` });
    }
    return res.send({ message: "Shift deleted successfully." });
  } catch (err) {
    logger.error(`Error deleting shift ${req.params.id}: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error deleting shift" });
  }
};

export default exports;
