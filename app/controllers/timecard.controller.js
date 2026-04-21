import db from "../models/index.js";
import logger from "../config/logger.js";

const User = db.user;
const Employer = db.employer;
const Employee = db.employee;
const Shift = db.shift;
const Schedule = db.schedule;
const BusinessArea = db.businessArea;
const ClockInTime = db.clockInTime;
const ClockOutTime = db.clockOutTime;
const Op = db.Sequelize.Op;
const exports = {};

const parseDayMeta = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (err) {
    // Older rows may store a plain label instead of JSON metadata.
  }

  return {
    label: value || "",
    employeeName: "",
    position: "",
    dayKey: "",
  };
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const match = String(value).match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : String(value);
};

const toMillis = (value) => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const roundHours = (value) => Number((value || 0).toFixed(2));

const hoursBetweenTimes = (startTime, endTime) => {
  const startMatch = String(startTime || "").match(/(\d{2}):(\d{2})/);
  const endMatch = String(endTime || "").match(/(\d{2}):(\d{2})/);

  if (!startMatch || !endMatch) {
    return 0;
  }

  const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
  const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
  const rawMinutes = endMinutes >= startMinutes
    ? endMinutes - startMinutes
    : (24 * 60 - startMinutes) + endMinutes;

  return roundHours(rawMinutes / 60);
};

const buildShiftEndDateTime = (dateValue, endTime) => {
  if (!dateValue || !endTime) {
    return null;
  }

  const normalizedTime = String(endTime).length === 5 ? `${endTime}:00` : String(endTime);
  const parsed = new Date(`${String(dateValue).slice(0, 10)}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildEmployeeName = (shift, meta) => {
  if (!shift.EmployeeID) {
    return "";
  }

  return [shift.employee?.firstName, shift.employee?.lastName].filter(Boolean).join(" ").trim()
    || meta.employeeName
    || "";
};

const groupRowsByShiftId = (rows = []) =>
  rows.reduce((groups, row) => {
    const key = String(row.ShiftID);
    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(row);
    return groups;
  }, new Map());

const buildWorkedSummary = (clockInRows = [], clockOutRows = []) => {
  const clockIns = [...clockInRows]
    .map((row) => row.dateTime)
    .filter(Boolean)
    .sort((left, right) => toMillis(left) - toMillis(right));
  const clockOuts = [...clockOutRows]
    .map((row) => row.dateTime)
    .filter(Boolean)
    .sort((left, right) => toMillis(left) - toMillis(right));

  let outIndex = 0;
  let workedMilliseconds = 0;

  for (const clockInTime of clockIns) {
    const clockInMs = toMillis(clockInTime);
    while (outIndex < clockOuts.length && toMillis(clockOuts[outIndex]) < clockInMs) {
      outIndex += 1;
    }

    if (outIndex < clockOuts.length) {
      workedMilliseconds += Math.max(0, toMillis(clockOuts[outIndex]) - clockInMs);
      outIndex += 1;
    }
  }

  const earliestClockInTime = clockIns[0] || null;
  const latestClockInTime = clockIns[clockIns.length - 1] || null;
  const latestClockOutTime = clockOuts[clockOuts.length - 1] || null;
  const hasOpenClockIn = Boolean(latestClockInTime) && toMillis(latestClockInTime) > toMillis(latestClockOutTime);

  return {
    earliestClockInTime,
    latestClockInTime,
    latestClockOutTime,
    hasOpenClockIn,
    workedHours: roundHours(workedMilliseconds / 3600000),
  };
};

const buildStatus = ({ hasOpenClockIn, latestClockOutTime, shiftEndAt, now }) => {
  const shiftEnded = Boolean(shiftEndAt) && shiftEndAt.getTime() < now.getTime();

  if (hasOpenClockIn) {
    return shiftEnded ? "missed" : "clocked-in";
  }

  if (latestClockOutTime) {
    return "completed";
  }

  return shiftEnded ? "missed" : "scheduled";
};

const matchesSearch = (timecard, search) => {
  if (!search) {
    return true;
  }

  const haystack = [
    timecard.employeeName,
    timecard.position,
    timecard.dayLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(String(search).trim().toLowerCase());
};

const resolveEmployerForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return { user: null, employer: null };
  }

  const employer = user.email
    ? await Employer.findOne({ where: { email: user.email } })
    : null;

  return { user, employer };
};

const findEmployerScheduleIds = async (employer) => {
  if (!employer?.employerid) {
    return [];
  }

  const schedules = await Schedule.findAll({
    attributes: ["scheduleId"],
    include: [
      {
        model: BusinessArea,
        attributes: [],
        where: { EmployerID: employer.employerid },
        required: true,
      },
    ],
  });

  return schedules
    .map((row) => row.scheduleId)
    .filter((value) => value !== null && value !== undefined);
};

const loadShifts = async (scheduleIds = []) => {
  const include = [{ model: Employee }];

  if (scheduleIds.length) {
    include.push({
      model: Schedule,
      attributes: [],
      where: { scheduleId: { [Op.in]: scheduleIds } },
      required: true,
    });
  }

  return Shift.findAll({
    include,
    order: [["startDate", "DESC"], ["startTime", "DESC"]],
  });
};

exports.getEmployerTimecards = async (req, res) => {
  const { userId } = req.params;
  const { employeeId, status, dateFrom, dateTo, search } = req.query;

  try {
    const { user, employer } = await resolveEmployerForUser(userId);
    if (!user) {
      return res.status(404).send({ message: `Cannot find User with id=${userId}.` });
    }

    const scheduleIds = employer ? await findEmployerScheduleIds(employer) : [];
    let shifts = await loadShifts(scheduleIds);

    // The current seed/demo data stores many shifts without ScheduleID links.
    // Fall back to the existing global shift set so the employer timecards view
    // still works with the project's current data shape.
    if (!shifts.length) {
      shifts = await loadShifts();
    }

    const shiftIds = shifts
      .map((shift) => shift.shiftId)
      .filter((value) => value !== null && value !== undefined);

    const [clockInRows, clockOutRows] = await Promise.all([
      shiftIds.length
        ? ClockInTime.findAll({
            where: { ShiftID: { [Op.in]: shiftIds } },
            order: [["dateTime", "ASC"]],
          })
        : [],
      shiftIds.length
        ? ClockOutTime.findAll({
            where: { ShiftID: { [Op.in]: shiftIds } },
            order: [["dateTime", "ASC"]],
          })
        : [],
    ]);

    const clockInsByShiftId = groupRowsByShiftId(clockInRows);
    const clockOutsByShiftId = groupRowsByShiftId(clockOutRows);
    const now = new Date();

    const timecards = shifts
      .map((shift) => {
        const meta = parseDayMeta(shift.day);
        const clockSummary = buildWorkedSummary(
          clockInsByShiftId.get(String(shift.shiftId)) || [],
          clockOutsByShiftId.get(String(shift.shiftId)) || [],
        );
        const scheduledStartTime = formatTime(shift.startTime);
        const scheduledEndTime = formatTime(shift.endTime);
        const scheduledHours = hoursBetweenTimes(scheduledStartTime, scheduledEndTime);
        const shiftEndAt = buildShiftEndDateTime(shift.startDate, shift.endTime);
        const rowStatus = buildStatus({
          hasOpenClockIn: clockSummary.hasOpenClockIn,
          latestClockOutTime: clockSummary.latestClockOutTime,
          shiftEndAt,
          now,
        });

        const clockInTime = clockSummary.hasOpenClockIn
          ? clockSummary.latestClockInTime
          : clockSummary.earliestClockInTime;
        const clockOutTime = clockSummary.hasOpenClockIn ? null : clockSummary.latestClockOutTime;

        return {
          shiftId: shift.shiftId,
          employeeId: shift.EmployeeID ?? null,
          employeeName: buildEmployeeName(shift, meta),
          position: meta.position || "Shift",
          dayLabel: meta.label || "",
          date: String(shift.startDate).slice(0, 10),
          scheduledStartTime,
          scheduledEndTime,
          scheduledHours,
          clockInTime,
          clockOutTime,
          workedHours: clockSummary.workedHours,
          varianceHours: roundHours(clockSummary.workedHours - scheduledHours),
          status: rowStatus,
        };
      })
      .filter((timecard) => !employeeId || String(timecard.employeeId) === String(employeeId))
      .filter((timecard) => !status || timecard.status === status)
      .filter((timecard) => !dateFrom || timecard.date >= String(dateFrom).slice(0, 10))
      .filter((timecard) => !dateTo || timecard.date <= String(dateTo).slice(0, 10))
      .filter((timecard) => matchesSearch(timecard, search));

    return res.send(timecards);
  } catch (err) {
    logger.error(`Error retrieving employer timecards for user ${userId}: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving employer timecards.",
    });
  }
};

export default exports;
