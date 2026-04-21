import db from "../models/index.js";
import logger from "../config/logger.js";

const Employee = db.employee;
const User = db.user;
const Shift = db.shift;
const TimeOff = db.timeOff;
const EmployeeAvailability = db.employeeAvailability;
const Op = db.Sequelize.Op;
const exports = {};
const ClockInTime = db.clockInTime;
const ClockOutTime = db.clockOutTime;

const dayConfigs = [
  { dayKey: "mon", label: "Monday", index: 1 },
  { dayKey: "tue", label: "Tuesday", index: 2 },
  { dayKey: "wed", label: "Wednesday", index: 3 },
  { dayKey: "thu", label: "Thursday", index: 4 },
  { dayKey: "fri", label: "Friday", index: 5 },
  { dayKey: "sat", label: "Saturday", index: 6 },
  { dayKey: "sun", label: "Sunday", index: 0 },
];

const defaultAvailability = () =>
  dayConfigs.map((day) => ({
    dayKey: day.dayKey,
    label: day.label,
    available: day.index >= 1 && day.index <= 5,
    startTime: day.index >= 1 && day.index <= 5 ? "09:00" : "",
    endTime: day.index >= 1 && day.index <= 5 ? "17:00" : "",
  }));

const extractEmployeePayload = (body) => ({
  EmployeeID: body.EmployeeID ?? body.id ?? null,
  firstName: body.firstName || body.fName || "",
  lastName: body.lastName || body.lName || "",
  email: body.email || "",
  phoneNum: body.phoneNum || "",
  school: body.school || "",
  schoolYear: body.schoolYear || "",
  major: body.major || "",
  studentId: body.studentId || "",
});

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

const toDateTime = (dateValue, timeValue) => {
  const date = parseLocalDate(dateValue);
  if (!date || !timeValue) {
    return null;
  }

  const [hours, minutes, secondsRaw] = String(timeValue).split(":");
  const hoursNumber = Number(hours);
  const minutesNumber = Number(minutes);
  const secondsNumber = Number(secondsRaw || "0");

  if ([hoursNumber, minutesNumber, secondsNumber].some(Number.isNaN)) {
    return null;
  }

  const parsed = new Date(date);
  parsed.setHours(hoursNumber, minutesNumber, secondsNumber, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const raw = String(value);
  const timeMatch = raw.match(/^(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const parseShiftMeta = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    // Some rows still store plain labels in `day`.
  }

  return {
    label: value || "",
    position: "",
    dayKey: "",
    taskListId: null,
  };
};

const getStartOfWeek = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const sameLocalDay = (first, second) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const initialsFor = (firstName, lastName, email) =>
  [firstName?.[0], lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || String(email || "?").slice(0, 2).toUpperCase();

const normalizeAvailability = (availabilityText) => {
  if (!availabilityText) {
    return defaultAvailability();
  }

  let parsed = availabilityText;
  if (typeof availabilityText === "string") {
    try {
      parsed = JSON.parse(availabilityText);
    } catch (err) {
      return defaultAvailability();
    }
  }

  const entries = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.weeklyAvailability)
      ? parsed.weeklyAvailability
      : [];

  const byDayKey = new Map(
    entries
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => [String(entry.dayKey || "").toLowerCase(), entry]),
  );

  return dayConfigs.map((day) => {
    const match = byDayKey.get(day.dayKey);
    const available = Boolean(match?.available);
    return {
      dayKey: day.dayKey,
      label: day.label,
      available,
      startTime: available ? String(match?.startTime || "09:00").slice(0, 5) : "",
      endTime: available ? String(match?.endTime || "17:00").slice(0, 5) : "",
    };
  });
};

const normalizeUnavailableBlocks = (availabilityText) => {
  if (!availabilityText) {
    return [];
  }

  try {
    const parsed = typeof availabilityText === "string" ? JSON.parse(availabilityText) : availabilityText;
    const blocks = Array.isArray(parsed?.unavailableBlocks) ? parsed.unavailableBlocks : [];

    return blocks
      .filter((block) => block?.dayKey && block?.startTime && block?.endTime)
      .map((block, index) => ({
        id: block.id || `unavailable-${index + 1}`,
        dayKey: String(block.dayKey).toLowerCase(),
        label: block.label || dayConfigs.find((day) => day.dayKey === String(block.dayKey).toLowerCase())?.label || "",
        startTime: String(block.startTime).slice(0, 5),
        endTime: String(block.endTime).slice(0, 5),
        reason: block.reason || "Unavailable",
      }));
  } catch (err) {
    return [];
  }
};

const formatAvailabilitySummary = (row) =>
  row.available && row.startTime && row.endTime
    ? `${row.startTime} - ${row.endTime}`
    : "Unavailable";

const resolveClockDay = (shift, fallbackDate = new Date()) => {
  const shiftDate = parseLocalDate(shift?.startDate);
  if (shiftDate) {
    return shiftDate;
  }

  const fallback = parseLocalDate(fallbackDate);
  return fallback || new Date();
};

const toMillis = (value) => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const hasOpenClockIn = (clockInRow, clockOutRow) =>
  Boolean(clockInRow) && (!clockOutRow || toMillis(clockInRow.dateTime) > toMillis(clockOutRow.dateTime));

const mapShiftForDashboard = (row) => {
  const meta = parseShiftMeta(row.day);
  const dateValue = parseLocalDate(row.startDate);
  const startTime = formatTime(row.startTime);
  const endTime = formatTime(row.endTime);
  const startAt = toDateTime(row.startDate, startTime);
  const endAt = toDateTime(row.startDate, endTime);
  const durationHours =
    startAt && endAt ? Math.max(0, (endAt.getTime() - startAt.getTime()) / 3600000) : 0;

  return {
    shiftId: row.shiftId,
    date: dateValue ? dateValue.toISOString().slice(0, 10) : row.startDate,
    dayLabel: meta.label || (dateValue ? dayConfigs.find((day) => day.index === dateValue.getDay())?.label : ""),
    dayKey:
      meta.dayKey ||
      (dateValue ? dayConfigs.find((day) => day.index === dateValue.getDay())?.dayKey : ""),
    position: meta.position || "Shift",
    taskListId: meta.taskListId || null,
    startTime,
    endTime,
    startAt: startAt ? startAt.toISOString() : null,
    endAt: endAt ? endAt.toISOString() : null,
    durationHours: Number(durationHours.toFixed(2)),
  };
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

exports.create = async (req, res) => {
  const payload = extractEmployeePayload(req.body);

  if (!payload.firstName || !payload.lastName || !payload.email) {
    logger.warn("Employee creation attempt with missing required fields");
    return res.status(400).send({ message: "firstName, lastName, and email are required" });
  }

  try {
    const employee = await Employee.create(payload);
    logger.info(`Employee created successfully: ${employee.EmployeeID} - ${employee.email}`);
    return res.status(201).send(employee);
  } catch (err) {
    logger.error(`Error creating employee: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the Employee.",
    });
  }
};

exports.findAll = async (req, res) => {
  const search = req.query.search || req.query.id;
  const condition = search
    ? {
        [Op.or]: [
          { EmployeeID: { [Op.like]: `%${search}%` } },
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      }
    : undefined;

  try {
    const employees = await Employee.findAll({
      where: condition,
      order: [["EmployeeID", "DESC"]],
    });

    logger.info(`Retrieved ${employees.length} employees`);
    return res.send(employees);
  } catch (err) {
    logger.error(`Error retrieving employees: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving employees.",
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      logger.warn(`Employee not found with id: ${req.params.id}`);
      return res.status(404).send({ message: `Cannot find Employee with id=${req.params.id}.` });
    }

    return res.send(employee);
  } catch (err) {
    logger.error(`Error retrieving employee ${req.params.id}: ${err.message}`);
    return res.status(500).send({
      message: "Error retrieving Employee with id=" + req.params.id,
    });
  }
};

exports.findByEmail = async (req, res) => {
  const email = req.params.email;

  try {
    const employee = await Employee.findOne({ where: { email } });
    if (!employee) {
      logger.warn(`Employee not found with email: ${email}`);
      return res.send({ email: "not found" });
    }

    return res.send(employee);
  } catch (err) {
    logger.error(`Error retrieving employee by email ${email}: ${err.message}`);
    return res.status(500).send({
      message: "Error retrieving Employee with email=" + email,
    });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id ?? req.params.EmployeeID;
  const payload = extractEmployeePayload(req.body);

  try {
    const [updated] = await Employee.update(
      {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNum: payload.phoneNum,
        school: payload.school,
        schoolYear: payload.schoolYear,
        major: payload.major,
        studentId: payload.studentId,
      },
      { where: { EmployeeID: id } },
    );

    if (updated !== 1) {
      logger.warn(`Failed to update employee ${id}`);
      return res.status(404).send({ message: `Cannot update Employee with id=${id}.` });
    }

    const employee = await Employee.findByPk(id);
    return res.send(employee);
  } catch (err) {
    logger.error(`Error updating employee ${id}: ${err.message}`);
    return res.status(500).send({
      message: "Error updating Employee with id=" + id,
    });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const deleted = await Employee.destroy({ where: { EmployeeID: id } });
    if (deleted !== 1) {
      logger.warn(`Cannot delete employee ${id} - not found`);
      return res.status(404).send({ message: `Cannot delete Employee with id=${id}.` });
    }

    return res.send({ message: "Employee deleted successfully." });
  } catch (err) {
    logger.error(`Error deleting employee ${id}: ${err.message}`);
    return res.status(500).send({
      message: "Could not delete Employee with id=" + id,
    });
  }
};

exports.getAvailabilityIndex = async (_req, res) => {
  try {
    const rows = await EmployeeAvailability.findAll({
      order: [["EmployeeID", "ASC"]],
    });

    const availability = rows.map((row) => ({
      EmployeeID: row.EmployeeID,
      availabilityText: row.availabilityText || "",
      availability: normalizeAvailability(row.availabilityText).map((entry) => ({
        ...entry,
        summary: formatAvailabilitySummary(entry),
      })),
      unavailableBlocks: normalizeUnavailableBlocks(row.availabilityText),
    }));

    return res.send(availability);
  } catch (err) {
    logger.error(`Error retrieving employee availability index: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving employee availability.",
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

    const employee = await resolveEmployeeForUser(user);
    if (!employee) {
      return res.status(404).send({ message: "Employee profile not found." });
    }

    return res.send(employee);
  } catch (err) {
    logger.error(`Error retrieving employee profile for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving the employee profile.",
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

    const existing = await resolveEmployeeForUser(user);
    const payload = extractEmployeePayload({
      ...req.body,
      email: req.body.email || user.email,
      firstName: req.body.firstName || user.fName,
      lastName: req.body.lastName || user.lName,
    });

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.school || !payload.schoolYear) {
      return res.status(400).send({
        message: "firstName, lastName, email, school, and schoolYear are required.",
      });
    }

    let employee = existing;
    if (employee) {
      await Employee.update(payload, { where: { EmployeeID: employee.EmployeeID } });
      employee = await Employee.findByPk(employee.EmployeeID);
    } else {
      employee = await Employee.create(payload);
    }

    if (user.EmployeeID !== employee.EmployeeID) {
      await User.update({ EmployeeID: employee.EmployeeID }, { where: { id: user.id } });
    }

    return res.status(existing ? 200 : 201).send(employee);
  } catch (err) {
    logger.error(`Error creating employee profile for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the employee profile.",
    });
  }
};

exports.getDashboard = async (req, res) => {
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

    const [availabilityRecord, shifts, timeOffs] = await Promise.all([
      EmployeeAvailability.findOne({ where: { EmployeeID: employee.EmployeeID } }),
      Shift.findAll({
        where: { EmployeeID: employee.EmployeeID },
        order: [["startDate", "ASC"], ["startTime", "ASC"]],
      }),
      TimeOff.findAll({
        where: { EmployeeID: employee.EmployeeID },
        order: [["startDate", "DESC"]],
      }),
    ]);

    const availability = normalizeAvailability(availabilityRecord?.availabilityText);
    const unavailableBlocks = normalizeUnavailableBlocks(availabilityRecord?.availabilityText);
    const mappedShifts = shifts.map(mapShiftForDashboard);
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekDays = dayConfigs.map((day, offset) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + offset);
      const shiftsForDay = mappedShifts.filter((shift) => {
        const shiftDate = parseLocalDate(shift.date);
        return shiftDate ? sameLocalDay(shiftDate, date) : false;
      });

      return {
        dayKey: day.dayKey,
        label: day.label,
        date: date.toISOString().slice(0, 10),
        shiftCount: shiftsForDay.length,
        shifts: shiftsForDay,
      };
    });

    const upcomingShifts = mappedShifts
      .filter((shift) => {
        if (!shift.endAt) {
          return false;
        }
        return new Date(shift.endAt).getTime() >= now.getTime();
      })
      .slice(0, 6);

    const weeklyHours = weekDays
      .flatMap((day) => day.shifts)
      .reduce((total, shift) => total + shift.durationHours, 0);

    const timeOffHistory = timeOffs.slice(0, 6).map((row) => ({
      timeOffId: row.TimeOffId,
      startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : "",
      endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : "",
      reason: row.reasons || "",
    }));

    return res.send({
      profile: {
        userId: user.id,
        employeeId: employee.EmployeeID,
        firstName: employee.firstName || user.fName || "",
        lastName: employee.lastName || user.lName || "",
        name:
          [employee.firstName || user.fName, employee.lastName || user.lName]
            .filter(Boolean)
            .join(" ")
            .trim() || user.email,
        email: employee.email || user.email || "",
        phoneNum: employee.phoneNum || "",
        school: employee.school || "",
        schoolYear: employee.schoolYear || "",
        major: employee.major || "",
        studentId: employee.studentId || "",
        initials: initialsFor(employee.firstName || user.fName, employee.lastName || user.lName, employee.email || user.email),
      },
      summary: {
        nextShift: upcomingShifts[0] || null,
        weeklyHours: Number(weeklyHours.toFixed(2)),
        totalUpcomingShifts: upcomingShifts.length,
        availableDays: availability.filter((day) => day.available).length,
      },
      weeklySchedule: weekDays,
      upcomingShifts,
      availability: availability.map((row) => ({
        ...row,
        summary: formatAvailabilitySummary(row),
      })),
      unavailableBlocks,
      timeOffHistory,
    });
  } catch (err) {
    logger.error(`Error building employee dashboard for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving the employee dashboard.",
    });
  }
};

exports.updateAvailability = async (req, res) => {
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
    const availability = normalizeAvailability(
      req.body.weeklyAvailability || req.body.availability || req.body,
    );
    const unavailableBlocks = normalizeUnavailableBlocks({
      unavailableBlocks: req.body.unavailableBlocks || [],
    });

    const existing = await EmployeeAvailability.findOne({
      where: { EmployeeID: employee.EmployeeID },
    });

    if (existing) {
      existing.availabilityText = JSON.stringify({ weeklyAvailability: availability, unavailableBlocks });
      await existing.save();
    } else {
      await EmployeeAvailability.create({
        EmployeeID: employee.EmployeeID,
        availabilityText: JSON.stringify({ weeklyAvailability: availability, unavailableBlocks }),
      });
    }

    return res.send({
      employeeId: employee.EmployeeID,
      availability: availability.map((row) => ({
        ...row,
        summary: formatAvailabilitySummary(row),
      })),
      unavailableBlocks,
    });
  } catch (err) {
    logger.error(`Error updating employee availability for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while saving availability.",
    });
  }
};

exports.getTodayShift = async (req, res) => {
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

    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);

    const shifts = await Shift.findAll({
      where: { EmployeeID: employee.EmployeeID },
      order: [["startDate", "ASC"], ["startTime", "ASC"]],
    });

    const mappedShifts = shifts.map(mapShiftForDashboard);
    const todaysShift = mappedShifts.find((shift) => shift.date === todayString) || null;

    return res.send(todaysShift);
  } catch (err) {
    logger.error(`Error retrieving today's shift for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving today's shift.",
    });
  }
};

exports.getTimeClockStatus = async (req, res) => {
  const { shiftId } = req.params;

  try {
    const [clockInRow, clockOutRow] = await Promise.all([
      ClockInTime.findOne({
        where: { ShiftID: shiftId },
        order: [["clockInId", "DESC"]],
      }),
      ClockOutTime.findOne({
        where: { ShiftID: shiftId },
        order: [["clockOutId", "DESC"]],
      }),
    ]);

    return res.send({
      clockInTime: clockInRow?.dateTime || null,
      clockOutTime: clockOutRow?.dateTime || null,
    });
  } catch (err) {
    logger.error(`Error retrieving time clock status for shift ${shiftId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving time clock status.",
    });
  }
};

exports.clockIn = async (req, res) => {
  const { userId, shiftId } = req.params;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${userId}.` });
    }

    const employee = await resolveEmployeeForUser(user);
    if (!employee) {
      return res.status(404).send({ message: "Employee profile not found." });
    }

    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
      return res.status(404).send({ message: `Cannot find Shift with id=${shiftId}.` });
    }

    if (shift.EmployeeID !== employee.EmployeeID) {
      return res.status(403).send({ message: "This shift does not belong to the current employee." });
    }

    const [latestClockIn, latestClockOut] = await Promise.all([
      ClockInTime.findOne({
        where: { ShiftID: shiftId },
        order: [["clockInId", "DESC"]],
      }),
      ClockOutTime.findOne({
        where: { ShiftID: shiftId },
        order: [["clockOutId", "DESC"]],
      }),
    ]);

    if (hasOpenClockIn(latestClockIn, latestClockOut)) {
      return res.status(400).send({ message: "You have already clocked in for this shift." });
    }

    const now = new Date();
    const record = await ClockInTime.create({
      ShiftID: shiftId,
      dateTime: now,
      startTime: now,
      day: resolveClockDay(shift, now),
    });

    return res.status(201).send(record);
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
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${userId}.` });
    }

    const employee = await resolveEmployeeForUser(user);
    if (!employee) {
      return res.status(404).send({ message: "Employee profile not found." });
    }

    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
      return res.status(404).send({ message: `Cannot find Shift with id=${shiftId}.` });
    }

    if (shift.EmployeeID !== employee.EmployeeID) {
      return res.status(403).send({ message: "This shift does not belong to the current employee." });
    }

    const [latestClockIn, latestClockOut] = await Promise.all([
      ClockInTime.findOne({
        where: { ShiftID: shiftId },
        order: [["clockInId", "DESC"]],
      }),
      ClockOutTime.findOne({
        where: { ShiftID: shiftId },
        order: [["clockOutId", "DESC"]],
      }),
    ]);

    if (!latestClockIn) {
      return res.status(400).send({ message: "You must clock in before clocking out." });
    }

    if (!hasOpenClockIn(latestClockIn, latestClockOut)) {
      return res.status(400).send({ message: "You are not currently clocked in." });
    }

    const now = new Date();
    const record = await ClockOutTime.create({
      ShiftID: shiftId,
      dateTime: now,
      endTime: now,
      day: resolveClockDay(shift, now),
    });

    return res.status(201).send(record);
  } catch (err) {
    logger.error(`Error clocking out for shift ${shiftId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while clocking out.",
    });
  }
};

export default exports;
