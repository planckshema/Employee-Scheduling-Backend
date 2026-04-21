import db from "../models/index.js";
import logger from "../config/logger.js";
import axios from "axios";

const exports = {};

// School API configuration
const SCHOOL_API_BASE = process.env.SCHOOL_API_BASE_URL || "https://stingray.oc.edu/api";
const SCHOOL_TERM_CODE = process.env.SCHOOL_TERM_CODE || "2026SP";

const dayAliases = {
  monday: "mon",
  mon: "mon",
  m: "mon",
  tuesday: "tue",
  tue: "tue",
  tues: "tue",
  t: "tue",
  wednesday: "wed",
  wed: "wed",
  w: "wed",
  thursday: "thu",
  thu: "thu",
  thur: "thu",
  thurs: "thu",
  r: "thu",
  friday: "fri",
  fri: "fri",
  f: "fri",
  saturday: "sat",
  sat: "sat",
  sunday: "sun",
  sun: "sun",
  th: "thu",
};

const normalizeDayOfWeek = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = String(value).trim().toLowerCase();
  return dayAliases[raw] || raw.slice(0, 3);
};

const normalizeTime = (value) => {
  if (!value) {
    return "";
  }

  const raw = String(value).trim();
  const meridiemMatch = raw.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)$/i);
  if (meridiemMatch) {
    let hour = Number(meridiemMatch[1]);
    const minute = meridiemMatch[2] || "00";
    const meridiem = meridiemMatch[3].toLowerCase().replace(/\./g, "");
    if (meridiem === "pm" && hour !== 12) {
      hour += 12;
    }
    if (meridiem === "am" && hour === 12) {
      hour = 0;
    }
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  const timeMatch = raw.match(/^(\d{1,2})(?:[:.](\d{2}))/);
  if (timeMatch) {
    return `${String(Number(timeMatch[1])).padStart(2, "0")}:${timeMatch[2]}`;
  }

  const compactMeridiemMatch = raw.match(/^(\d{1,2})(\d{2})\s*(a\.?m\.?|p\.?m\.?|am|pm)$/i);
  if (compactMeridiemMatch) {
    let hour = Number(compactMeridiemMatch[1]);
    const minute = compactMeridiemMatch[2];
    const meridiem = compactMeridiemMatch[3].toLowerCase().replace(/\./g, "");
    if (meridiem === "pm" && hour !== 12) {
      hour += 12;
    }
    if (meridiem === "am" && hour === 12) {
      hour = 0;
    }
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  const compactMatch = raw.match(/^(\d{1,2})(\d{2})$/);
  if (compactMatch) {
    return `${String(Number(compactMatch[1])).padStart(2, "0")}:${compactMatch[2]}`;
  }
  return raw.slice(0, 5);
};

const termOrDefault = (term) => term || SCHOOL_TERM_CODE;

const courseMeetingDayAliases = {
  M: "mon",
  T: "tue",
  W: "wed",
  TH: "thu",
  R: "thu",
  F: "fri",
  S: "sat",
  SA: "sat",
  SU: "sun",
};

const normalizeCourseMeetingDay = (value) =>
  courseMeetingDayAliases[String(value || "").trim().toUpperCase()] ||
  normalizeDayOfWeek(value);

const normalizeSchoolApiRows = (data) => {
  if (Array.isArray(data?.Courses)) {
    return data.Courses.flatMap((course) => {
      const meetings = Array.isArray(course.meeting_times) ? course.meeting_times : [];

      return meetings.flatMap((meeting) => {
        const days = Array.isArray(meeting.days)
          ? meeting.days
          : Array.isArray(course.meeting_days)
            ? course.meeting_days
            : [];

        return days.map((day) => ({
          type: "class",
          courseCode: course.CourseID || course.courseCode || "",
          courseName: course.CourseName || course.courseName || "Class",
          dayOfWeek: normalizeCourseMeetingDay(day),
          startTime: normalizeTime(meeting.start_time || meeting.startTime),
          endTime: normalizeTime(meeting.end_time || meeting.endTime),
          location: course.Location || course.location || "",
        }));
      });
    }).filter((cls) => cls.dayOfWeek && cls.startTime && cls.endTime);
  }

  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.classes)
      ? data.classes
      : Array.isArray(data?.classSchedule)
        ? data.classSchedule
        : Array.isArray(data?.schedule)
          ? data.schedule
          : [];

  return rows.map((cls) => ({
    type: "class",
    courseCode: cls.courseCode || cls.code || cls.course || cls.section || "",
    courseName: cls.courseName || cls.name || cls.title || cls.courseTitle || "Class",
    dayOfWeek: normalizeDayOfWeek(cls.dayOfWeek || cls.day || cls.meetingDay || cls.weekday),
    startTime: normalizeTime(cls.startTime || cls.start || cls.beginTime || cls.meetingStart),
    endTime: normalizeTime(cls.endTime || cls.end || cls.finishTime || cls.meetingEnd),
    location: cls.location || cls.room || cls.building || "",
  })).filter((cls) => cls.dayOfWeek && cls.startTime && cls.endTime);
};

const normalizeAvailabilityText = (availabilityText) => {
  if (!availabilityText) {
    return [];
  }

  try {
    const parsed = typeof availabilityText === "string"
      ? JSON.parse(availabilityText)
      : availabilityText;

    return Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.weeklyAvailability)
        ? parsed.weeklyAvailability
        : [];
  } catch (error) {
    return [];
  }
};

const schoolLookupCandidatesFor = (employee, user) => {
  const candidates = [
    user?.email ? String(user.email).split("@")[0] : "",
    user?.email,
    employee?.studentId,
  ];

  return Array.from(
    new Set(candidates.map((candidate) => String(candidate || "").trim()).filter(Boolean)),
  );
};

const fetchClassScheduleForCandidates = async (candidates, term) => {
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const apiUrl = `${SCHOOL_API_BASE}/accommodationuserschedule/${encodeURIComponent(candidate)}/${termOrDefault(term)}`;
      const response = await axios.get(apiUrl);

      if (String(response.data?.Success || "").toLowerCase() === "false") {
        lastError = new Error(response.data?.Message || "School API rejected the schedule lookup.");
        continue;
      }

      const classSchedule = normalizeSchoolApiRows(response.data);

      return {
        lookupId: candidate,
        classSchedule,
      };
    } catch (error) {
      lastError = error;
      logger.warn(`Could not fetch class schedule for ${candidate}: ${error.message}`);
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    lookupId: candidates[0] || "",
    classSchedule: [],
  };
};

const normalizeUnavailableBlocks = (availabilityText) => {
  if (!availabilityText) {
    return [];
  }

  try {
    const parsed = typeof availabilityText === "string"
      ? JSON.parse(availabilityText)
      : availabilityText;
    const blocks = Array.isArray(parsed?.unavailableBlocks) ? parsed.unavailableBlocks : [];

    return blocks
      .filter((block) => block?.dayKey && block?.startTime && block?.endTime)
      .map((block, index) => ({
        id: block.id || `unavailable-${index + 1}`,
        type: "unavailable",
        dayKey: String(block.dayKey).toLowerCase(),
        startTime: normalizeTime(block.startTime),
        endTime: normalizeTime(block.endTime),
        reason: block.reason || "Unavailable",
      }));
  } catch (error) {
    return [];
  }
};

// Get class schedule for a student
exports.getClassSchedule = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term } = req.query;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const { lookupId, classSchedule } = await fetchClassScheduleForCandidates([studentId], term);

    res.json({
      studentId,
      lookupId,
      term: termOrDefault(term),
      classes: classSchedule,
      classSchedule,
      classSchedules: classSchedule
    });

  } catch (error) {
    logger.error("Failed to fetch class schedule:", error.message);
    res.status(500).json({
      message: "Failed to fetch class schedule from school API",
      error: error.message
    });
  }
};

// Get current term information
exports.getCurrentTerm = async (req, res) => {
  try {
    // For now, return a default term. In a real implementation,
    // you might want to determine the current term based on date
    const currentTerm = {
      termCode: SCHOOL_TERM_CODE,
      termName: SCHOOL_TERM_CODE,
      startDate: "",
      endDate: ""
    };

    res.json(currentTerm);
  } catch (error) {
    logger.error("Failed to get current term:", error.message);
    res.status(500).json({ message: "Failed to fetch current term information" });
  }
};

// Validate student ID
exports.validateStudentId = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Try to fetch a schedule to validate the student ID
    const apiUrl = `${SCHOOL_API_BASE}/accommodationuserschedule/${studentId}/${SCHOOL_TERM_CODE}`;

    try {
      await axios.get(apiUrl);
      res.json({ valid: true, studentId });
    } catch (apiError) {
      if (apiError.response?.status === 404) {
        return res.json({ valid: false, message: "Student ID not found" });
      }
      throw apiError;
    }

  } catch (error) {
    logger.error("Failed to validate student ID:", error.message);
    res.status(500).json({ message: "Failed to validate student ID" });
  }
};

// Get merged availability (work availability + class schedule)
exports.getMergedAvailability = async (req, res) => {
  try {
    const { userId } = req.params;
    const { term } = req.query;

    // Get employee info
    const user = await db.user.findByPk(userId);
    let employee = null;

    if (user?.EmployeeID) {
      employee = await db.employee.findByPk(user.EmployeeID);
    }

    if (!employee && user?.email) {
      employee = await db.employee.findOne({ where: { email: user.email } });
    }

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Get work availability
    const workAvailability = await db.employeeAvailability.findOne({
      where: { EmployeeID: employee.EmployeeID }
    });

    let mergedSchedule = {
      employeeId: employee.EmployeeID,
      studentId: employee.studentId || "",
      workAvailability: [],
      classSchedule: [],
      classSchedules: [],
      unavailableBlocks: [],
      mergedAvailability: [],
      conflicts: []
    };

    mergedSchedule.workAvailability = normalizeAvailabilityText(workAvailability?.availabilityText);
    mergedSchedule.unavailableBlocks = normalizeUnavailableBlocks(workAvailability?.availabilityText);

    const lookupCandidates = schoolLookupCandidatesFor(employee, user);

    // Get class schedule from saved student ID or school-login email.
    if (lookupCandidates.length) {
      try {
        const { lookupId, classSchedule } = await fetchClassScheduleForCandidates(lookupCandidates, term);
        mergedSchedule.lookupId = lookupId;
        mergedSchedule.classSchedule = classSchedule;
        mergedSchedule.classSchedules = mergedSchedule.classSchedule;

        // Check for conflicts
        mergedSchedule.conflicts = findScheduleConflicts(
          mergedSchedule.workAvailability,
          mergedSchedule.classSchedule
        );

      } catch (classError) {
        logger.warn(`Could not fetch class schedule for user ${userId}:`, classError.message);
        mergedSchedule.classScheduleError = classError.message;
        // Continue without class schedule
      }
    }

    mergedSchedule.mergedAvailability = [
      ...mergedSchedule.workAvailability.map((entry) => ({ ...entry, type: "work" })),
      ...mergedSchedule.classSchedule,
      ...mergedSchedule.unavailableBlocks,
    ];

    res.json(mergedSchedule);

  } catch (error) {
    logger.error("Merged availability error:", error.message);
    res.status(500).json({ message: "Failed to get merged availability" });
  }
};

// Helper function to find conflicts between work and class schedules
const findScheduleConflicts = (workAvailability, classSchedule) => {
  const conflicts = [];

  workAvailability.forEach(workDay => {
    if (!workDay.available) return;

    const workStart = new Date(`2000-01-01T${workDay.startTime}`);
    const workEnd = new Date(`2000-01-01T${workDay.endTime}`);

    classSchedule.forEach(classItem => {
      if (classItem.dayOfWeek !== workDay.dayKey) return;

      const classStart = new Date(`2000-01-01T${classItem.startTime}`);
      const classEnd = new Date(`2000-01-01T${classItem.endTime}`);

      // Check for overlap
      if (workStart < classEnd && classStart < workEnd) {
        conflicts.push({
          day: workDay.dayKey,
          workTime: `${workDay.startTime} - ${workDay.endTime}`,
          classTime: `${classItem.startTime} - ${classItem.endTime}`,
          course: `${classItem.courseCode} - ${classItem.courseName}`,
          overlapMinutes: Math.round((Math.min(workEnd, classEnd) - Math.max(workStart, classStart)) / 60000)
        });
      }
    });
  });

  return conflicts;
};

export default exports;
