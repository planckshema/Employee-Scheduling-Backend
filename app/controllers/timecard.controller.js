import db from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const Employee = db.employee;
const Employer = db.employer;
const User = db.user;
const ClockInTime = db.clockInTime;
const ClockOutTime = db.clockOutTime;
const Op = db.Sequelize.Op;
const exports = {};

const dayConfigs = [
  { dayKey: "sun", label: "Sunday", index: 0 },
  { dayKey: "mon", label: "Monday", index: 1 },
  { dayKey: "tue", label: "Tuesday", index: 2 },
  { dayKey: "wed", label: "Wednesday", index: 3 },
  { dayKey: "thu", label: "Thursday", index: 4 },
  { dayKey: "fri", label: "Friday", index: 5 },
  { dayKey: "sat", label: "Saturday", index: 6 },
];

const parseLocalDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const raw = String(value).slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, monthIndex, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDateOnly = (value) => {
  const parsed = parseLocalDate(value);
  if (!parsed) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

  const match = String(value).match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
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

const toDateTime = (dateValue, timeValue) => {
  const date = parseLocalDate(dateValue);
  const parts = extractTimeParts(timeValue);

  if (!date || !parts) {
    return null;
  }

  const parsed = new Date(date);
  parsed.setHours(parts.hours, parts.minutes, parts.seconds, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTime = (value) => {
  const parts = extractTimeParts(value);
  if (!parts) {
    return "";
  }

  return `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}`;
};

const parseShiftMeta = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    // Older rows may store a plain string instead of structured metadata.
  }

  return {
    label: value || "",
    employeeName: "",
    position: "",
    dayKey: "",
    taskListId: null,
  };
};

const parseDateTimeInput = (value) => {
  if (!value) {
    return new Date();
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const roundHours = (milliseconds) => Number((milliseconds / 3600000).toFixed(2));

const toIsoOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const calculateDuration = (startAt, endAt) => {
  if (!startAt || !endAt) {
    return 0;
  }

  const normalizedEnd = new Date(endAt);
  if (normalizedEnd.getTime() <= startAt.getTime()) {
    normalizedEnd.setDate(normalizedEnd.getDate() + 1);
  }

  return Math.max(0, roundHours(normalizedEnd.getTime() - startAt.getTime()));
};

const resolveEmployeeForUser = async (user) => {
  if (!user) {
    return null;
  }

  let employee = null;

  if (user.EmployeeID) {
    employee = await Employee.findByPk(user.EmployeeID);
  }

  if (!employee && user.email) {
    employee = await Employee.findOne({ where: { email: user.email } });
  }

  if (employee && user.EmployeeID !== employee.EmployeeID) {
    await User.update({ EmployeeID: employee.EmployeeID }, { where: { id: user.id } });
  }

  return employee;
};

const resolveEmployerForUser = async (user) => {
  if (!user?.email) {
    return null;
  }

  return Employer.findOne({ where: { email: user.email } });
};

const loadShift = (shiftId) =>
  Shift.findByPk(shiftId, {
    include: [{ model: Employee }],
  });

const parseEmployeeIdFilter = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildDateScopedWhere = (query, baseWhere = {}) => {
  const where = { ...baseWhere };
  const dateFilter = query.date ? normalizeDateOnly(query.date) : null;
  const dateFrom = query.dateFrom ? normalizeDateOnly(query.dateFrom) : null;
  const dateTo = query.dateTo ? normalizeDateOnly(query.dateTo) : null;

  if (dateFilter) {
    where.startDate = dateFilter;
  } else if (dateFrom || dateTo) {
    where.startDate = {};
    if (dateFrom) {
      where.startDate[Op.gte] = dateFrom;
    }
    if (dateTo) {
      where.startDate[Op.lte] = dateTo;
    }
  }

  return where;
};

const loadClockEventsByShiftIds = async (shiftIds) => {
  if (!shiftIds.length) {
    return {
      clockInsByShiftId: new Map(),
      clockOutsByShiftId: new Map(),
    };
  }

  const [clockIns, clockOuts] = await Promise.all([
    ClockInTime.findAll({
      where: { ShiftID: { [Op.in]: shiftIds } },
      order: [["ShiftID", "ASC"], ["clockInId", "DESC"]],
    }),
    ClockOutTime.findAll({
      where: { ShiftID: { [Op.in]: shiftIds } },
      order: [["ShiftID", "ASC"], ["clockOutId", "DESC"]],
    }),
  ]);

  const clockInsByShiftId = new Map();
  for (const row of clockIns) {
    if (!clockInsByShiftId.has(row.ShiftID)) {
      clockInsByShiftId.set(row.ShiftID, row);
    }
  }

  const clockOutsByShiftId = new Map();
  for (const row of clockOuts) {
    if (!clockOutsByShiftId.has(row.ShiftID)) {
      clockOutsByShiftId.set(row.ShiftID, row);
    }
  }

  return { clockInsByShiftId, clockOutsByShiftId };
};

const buildTimecard = (shift, clockInRow, clockOutRow, now = new Date()) => {
  const meta = parseShiftMeta(shift.day);
  const date = normalizeDateOnly(shift.startDate) || shift.startDate || "";
  const scheduledStartTime = formatTime(shift.startTime);
  const scheduledEndTime = formatTime(shift.endTime);
  const scheduledStartAt = toDateTime(shift.startDate, scheduledStartTime);
  const scheduledEndAt = toDateTime(shift.startDate, scheduledEndTime);
  const clockInTime = clockInRow?.dateTime ? new Date(clockInRow.dateTime) : null;
  const clockOutTime = clockOutRow?.dateTime ? new Date(clockOutRow.dateTime) : null;
  const scheduledHours = calculateDuration(scheduledStartAt, scheduledEndAt);
  const workedHours =
    clockInTime && clockOutTime
      ? Math.max(0, roundHours(clockOutTime.getTime() - clockInTime.getTime()))
      : 0;
  const dayFromDate = parseLocalDate(date);
  const resolvedDay =
    dayConfigs.find((day) => day.dayKey === meta.dayKey) ||
    dayConfigs.find((day) => day.index === dayFromDate?.getDay()) ||
    null;
  const employeeName =
    meta.employeeName ||
    [shift.employee?.firstName, shift.employee?.lastName].filter(Boolean).join(" ").trim();

  let status = "scheduled";
  if (clockOutTime) {
    status = "completed";
  } else if (clockInTime) {
    status = "clocked-in";
  } else if (scheduledEndAt && scheduledEndAt.getTime() < now.getTime()) {
    status = "missed";
  }

  return {
    shiftId: shift.shiftId,
    EmployeeID: shift.EmployeeID ?? null,
    employeeName: employeeName || "",
    date,
    dayKey: meta.dayKey || resolvedDay?.dayKey || "",
    dayLabel: meta.label || resolvedDay?.label || "",
    position: meta.position || "Shift",
    taskListId: meta.taskListId || null,
    scheduledStartTime,
    scheduledEndTime,
    scheduledStartAt: toIsoOrNull(scheduledStartAt),
    scheduledEndAt: toIsoOrNull(scheduledEndAt),
    scheduledHours,
    clockInId: clockInRow?.clockInId || null,
    clockOutId: clockOutRow?.clockOutId || null,
    clockInTime: toIsoOrNull(clockInTime),
    clockOutTime: toIsoOrNull(clockOutTime),
    workedHours,
    varianceHours: Number((workedHours - scheduledHours).toFixed(2)),
    canClockIn: !clockInTime,
    canClockOut: Boolean(clockInTime) && !clockOutTime,
    status,
  };
};

const buildTimecardForShift = async (shift) => {
  const { clockInsByShiftId, clockOutsByShiftId } = await loadClockEventsByShiftIds([shift.shiftId]);
  return buildTimecard(
    shift,
    clockInsByShiftId.get(shift.shiftId),
    clockOutsByShiftId.get(shift.shiftId),
  );
};

const buildTimecardsForShifts = async (shifts, query = {}) => {
  const { clockInsByShiftId, clockOutsByShiftId } = await loadClockEventsByShiftIds(
    shifts.map((shift) => shift.shiftId),
  );

  const statusFilter = String(query.status || "").trim().toLowerCase();
  const searchFilter = String(query.search || "").trim().toLowerCase();

  return shifts
    .map((shift) =>
      buildTimecard(
        shift,
        clockInsByShiftId.get(shift.shiftId),
        clockOutsByShiftId.get(shift.shiftId),
      ),
    )
    .filter((timecard) => {
      if (statusFilter && statusFilter !== "all" && timecard.status !== statusFilter) {
        return false;
      }

      if (!searchFilter) {
        return true;
      }

      const haystack = [
        timecard.employeeName,
        timecard.position,
        timecard.dayLabel,
        timecard.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchFilter);
    });
};

const findScopedShiftForUser = async (userId, shiftId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return { status: 404, payload: { message: `Cannot find User with id=${userId}.` } };
  }

  const employee = await resolveEmployeeForUser(user);
  if (!employee) {
    return { status: 404, payload: { message: "Employee profile not found." } };
  }

  const shift = await loadShift(shiftId);
  if (!shift) {
    return { status: 404, payload: { message: `Cannot find Shift with id=${shiftId}.` } };
  }

  if (shift.EmployeeID !== employee.EmployeeID) {
    return {
      status: 403,
      payload: { message: "This shift does not belong to the current employee." },
    };
  }

  return { user, employee, shift };
};

const sendTimecardStatus = async (res, shift) => {
  const timecard = await buildTimecardForShift(shift);

  return res.send({
    clockInTime: timecard.clockInTime,
    clockOutTime: timecard.clockOutTime,
    workedHours: timecard.workedHours,
    scheduledHours: timecard.scheduledHours,
    status: timecard.status,
    canClockIn: timecard.canClockIn,
    canClockOut: timecard.canClockOut,
    timecard,
  });
};

exports.findForUser = async (req, res) => {
  const userId = req.params.userId || req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${userId}.` });
    }

    const employee = await resolveEmployeeForUser(user);
    if (!employee) {
      return res.status(404).send({ message: "Employee profile not found." });
    }

    const where = buildDateScopedWhere(req.query, { EmployeeID: employee.EmployeeID });

    const shifts = await Shift.findAll({
      where,
      include: [{ model: Employee }],
      order: [["startDate", "DESC"], ["startTime", "DESC"]],
    });

    const timecards = await buildTimecardsForShifts(shifts, req.query);

    return res.send(timecards);
  } catch (err) {
    logger.error(`Error retrieving timecards for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving timecards.",
    });
  }
};

exports.findForEmployer = async (req, res) => {
  const userId = req.params.userId || req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${userId}.` });
    }

    const employer = await resolveEmployerForUser(user);
    if (!employer) {
      return res.status(404).send({ message: "Employer profile not found." });
    }

    const where = buildDateScopedWhere(req.query, {
      EmployeeID: { [Op.ne]: null },
    });
    const employeeId = parseEmployeeIdFilter(req.query.employeeId);

    if (employeeId !== null) {
      where.EmployeeID = employeeId;
    }

    const shifts = await Shift.findAll({
      where,
      include: [{ model: Employee }],
      order: [["startDate", "DESC"], ["startTime", "DESC"]],
    });

    const timecards = await buildTimecardsForShifts(shifts, req.query);
    return res.send(timecards);
  } catch (err) {
    logger.error(`Error retrieving employer timecards for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving employer timecards.",
    });
  }
};

exports.findOneForUser = async (req, res) => {
  const { userId, shiftId } = req.params;

  try {
    const scopedShift = await findScopedShiftForUser(userId, shiftId);
    if (scopedShift.status) {
      return res.status(scopedShift.status).send(scopedShift.payload);
    }

    const timecard = await buildTimecardForShift(scopedShift.shift);
    return res.send(timecard);
  } catch (err) {
    logger.error(`Error retrieving timecard for shift ${shiftId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving the timecard.",
    });
  }
};

exports.getStatus = async (req, res) => {
  const { userId, shiftId } = req.params;

  try {
    const scopedShift = await findScopedShiftForUser(userId, shiftId);
    if (scopedShift.status) {
      return res.status(scopedShift.status).send(scopedShift.payload);
    }

    return sendTimecardStatus(res, scopedShift.shift);
  } catch (err) {
    logger.error(`Error retrieving timecard status for shift ${shiftId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving timecard status.",
    });
  }
};

exports.clockIn = async (req, res) => {
  const { userId, shiftId } = req.params;

  try {
    const scopedShift = await findScopedShiftForUser(userId, shiftId);
    if (scopedShift.status) {
      return res.status(scopedShift.status).send(scopedShift.payload);
    }

    const existingClockIn = await ClockInTime.findOne({
      where: { ShiftID: shiftId },
      order: [["clockInId", "DESC"]],
    });

    if (existingClockIn) {
      return res.status(400).send({ message: "You have already clocked in for this shift." });
    }

    const clockedAt = parseDateTimeInput(req.body?.dateTime);
    if (!clockedAt) {
      return res.status(400).send({ message: "Invalid clock-in time." });
    }

    const record = await ClockInTime.create({
      ShiftID: shiftId,
      dateTime: clockedAt,
      startTime: clockedAt,
      day: normalizeDateOnly(scopedShift.shift.startDate) || "",
    });

    const timecard = await buildTimecardForShift(scopedShift.shift);
    return res.status(201).send({
      ...record.toJSON(),
      timecard,
    });
  } catch (err) {
    logger.error(`Error clocking in for shift ${shiftId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while clocking in.",
    });
  }
};

exports.clockOut = async (req, res) => {
  const { userId, shiftId } = req.params;

  try {
    const scopedShift = await findScopedShiftForUser(userId, shiftId);
    if (scopedShift.status) {
      return res.status(scopedShift.status).send(scopedShift.payload);
    }

    const existingClockIn = await ClockInTime.findOne({
      where: { ShiftID: shiftId },
      order: [["clockInId", "DESC"]],
    });

    if (!existingClockIn) {
      return res.status(400).send({ message: "You must clock in before clocking out." });
    }

    const existingClockOut = await ClockOutTime.findOne({
      where: { ShiftID: shiftId },
      order: [["clockOutId", "DESC"]],
    });

    if (existingClockOut) {
      return res.status(400).send({ message: "You have already clocked out for this shift." });
    }

    const clockedAt = parseDateTimeInput(req.body?.dateTime);
    if (!clockedAt) {
      return res.status(400).send({ message: "Invalid clock-out time." });
    }

    const existingClockInTime = new Date(existingClockIn.dateTime);
    if (clockedAt.getTime() < existingClockInTime.getTime()) {
      return res.status(400).send({
        message: "Clock-out time cannot be earlier than the recorded clock-in time.",
      });
    }

    const record = await ClockOutTime.create({
      ShiftID: shiftId,
      dateTime: clockedAt,
      endTime: clockedAt,
      day: normalizeDateOnly(scopedShift.shift.startDate) || "",
    });

    const timecard = await buildTimecardForShift(scopedShift.shift);
    return res.status(201).send({
      ...record.toJSON(),
      timecard,
    });
  } catch (err) {
    logger.error(`Error clocking out for shift ${shiftId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while clocking out.",
    });
  }
};

export default exports;
