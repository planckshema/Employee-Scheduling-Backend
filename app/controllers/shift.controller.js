import db from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const Employee = db.employee;
const exports = {};

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const extractTimeParts = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return {
      hours: value.getUTCHours(),
      minutes: value.getUTCMinutes(),
      seconds: value.getUTCSeconds(),
    };
  }

  const raw = String(value);
  const match = raw.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || "0");

  if (
    [hours, minutes, seconds].some(Number.isNaN) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return { hours, minutes, seconds };
};

const parseLocalDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
  }

  const raw = String(dateValue).slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, monthIndex, day, 0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDateOnly = (dateValue) => {
  const parsed = parseLocalDate(dateValue);
  if (!parsed) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeTimeValue = (timeValue) => {
  const parts = extractTimeParts(timeValue);
  if (!parts) {
    return null;
  }

  return `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}:${String(parts.seconds).padStart(2, "0")}`;
};

const formatTime = (value) => {
  const parts = extractTimeParts(value);
  if (!parts) {
    return "";
  }

  return `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}`;
};

const parseDayMeta = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    // Older records may store a plain day label instead of JSON metadata.
  }

  return {
    label: value || "",
    employeeName: "",
    position: "",
    dayKey: "",
    taskListId: null,
  };
};

const buildDayMeta = ({ dateValue, employeeName, position, taskListId }) => ({
  label: weekdayLabels[dateValue.getDay()],
  dayKey: weekdayKeys[dateValue.getDay()],
  employeeName: employeeName || "",
  position: position || "",
  taskListId: taskListId || null,
});

const toApi = (row) => {
  const meta = parseDayMeta(row.day);
  const employeeName =
    meta.employeeName ||
    [row.employee?.firstName, row.employee?.lastName].filter(Boolean).join(" ").trim();

  return {
    shiftId: row.shiftId,
    EmployeeID: row.EmployeeID ?? null,
    dayKey: meta.dayKey || "",
    employeeName,
    position: meta.position || "",
    taskListId: meta.taskListId || null,
    date: row.startDate,
    startTime: formatTime(row.startTime),
    endTime: formatTime(row.endTime),
  };
};

const loadShift = (shiftId) =>
  Shift.findByPk(shiftId, {
    include: [{ model: Employee }],
  });

const extractShiftPayload = (body) => {
  const date = body.date || body.startDate;
  const startTime = body.startTime;
  const endTime = body.endTime;
  const employeeName =
    body.employeeName ||
    [body.firstName, body.lastName].filter(Boolean).join(" ").trim() ||
    [body.fName, body.lName].filter(Boolean).join(" ").trim();
  const EmployeeID = body.EmployeeID ?? body.employeeId ?? null;
  const taskListId = body.taskListId ?? body.TaskListID ?? null;
  const position = body.position || "Staff";

  return {
    date,
    startTime,
    endTime,
    employeeName: body.hasOwnProperty("employeeName") ? employeeName : employeeName,
    EmployeeID,
    taskListId,
    position,
  };
};

exports.create = async (req, res) => {
  const payload = extractShiftPayload(req.body);

  if (!payload.date || !payload.startTime || !payload.endTime) {
    logger.warn("Shift creation attempt with missing required fields");
    return res.status(400).send({
      message: "date/startDate, startTime, and endTime are required.",
    });
  }

  const dateValue = parseLocalDate(payload.date);
  const dateOnlyValue = normalizeDateOnly(payload.date);
  const startTimeValue = normalizeTimeValue(payload.startTime);
  const endTimeValue = normalizeTimeValue(payload.endTime);

  if (!dateValue || !dateOnlyValue || !startTimeValue || !endTimeValue) {
    return res.status(400).send({ message: "Invalid date or time format" });
  }

  try {
    const created = await Shift.create({
      EmployeeID: payload.EmployeeID,
      day: JSON.stringify(buildDayMeta({ ...payload, dateValue })),
      startTime: startTimeValue,
      endTime: endTimeValue,
      startDate: dateOnlyValue,
    });

    const row = await loadShift(created.shiftId);
    logger.info(`Shift created successfully: ID ${created.shiftId}`);
    return res.status(201).send(toApi(row || created));
  } catch (err) {
    logger.error(`Error creating shift: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the Shift.",
    });
  }
};

exports.findAll = async (_req, res) => {
  try {
    const rows = await Shift.findAll({
      include: [{ model: Employee }],
      order: [["startDate", "ASC"], ["startTime", "ASC"]],
    });

    logger.debug("Fetching all shifts for the dashboard");
    return res.send(rows.map(toApi));
  } catch (err) {
    logger.error(`Error retrieving shifts: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving shifts.",
    });
  }
};

exports.update = async (req, res) => {
  const payload = extractShiftPayload(req.body);
  const existing = await loadShift(req.params.id);

  if (!existing) {
    return res.status(404).send({ message: `Shift with id=${req.params.id} not found.` });
  }

  const existingMeta = parseDayMeta(existing.day);
  const mergedPayload = {
    date: payload.date || existing.startDate,
    startTime: payload.startTime || existing.startTime,
    endTime: payload.endTime || existing.endTime,
    employeeName: payload.employeeName || existingMeta.employeeName,
    EmployeeID: payload.EmployeeID ?? existing.EmployeeID ?? null,
    taskListId: payload.taskListId ?? existingMeta.taskListId ?? null,
    position: payload.position || existingMeta.position || "Staff",
  };

  const dateValue = parseLocalDate(mergedPayload.date);
  const dateOnlyValue = normalizeDateOnly(mergedPayload.date);
  const startTimeValue = normalizeTimeValue(mergedPayload.startTime);
  const endTimeValue = normalizeTimeValue(mergedPayload.endTime);

  if (!dateValue || !dateOnlyValue || !startTimeValue || !endTimeValue) {
    return res.status(400).send({ message: "Invalid shift payload" });
  }

  try {
    const [updated] = await Shift.update(
      {
        EmployeeID: mergedPayload.EmployeeID,
        day: JSON.stringify(buildDayMeta({ ...mergedPayload, dateValue })),
        startTime: startTimeValue,
        endTime: endTimeValue,
        startDate: dateOnlyValue,
      },
      { where: { shiftId: req.params.id } },
    );

    if (updated !== 1) {
      return res.status(404).send({ message: `Shift with id=${req.params.id} not found.` });
    }

    const row = await loadShift(req.params.id);
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
      return res.status(404).send({ message: `Cannot delete Shift with id=${req.params.id}.` });
    }

    return res.send({ message: "Shift deleted successfully." });
  } catch (err) {
    logger.error(`Error deleting shift ${req.params.id}: ${err.message}`);
    return res.status(500).send({ message: "Could not delete Shift with id=" + req.params.id });
  }
};

export default exports;
