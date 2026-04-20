import logger from "../config/logger.js";
import timecards from "./timecard.controller.js";

const exports = {};

exports.create = (req, res) => {
  const { userId, shiftId } = req.body || {};

  if (!userId || !shiftId) {
    logger.warn("Clock-in request missing userId or shiftId");
    return res.status(400).send({
      message: "userId and shiftId are required.",
    });
  }

  return timecards.clockIn(
    {
      ...req,
      params: {
        userId,
        shiftId,
      },
    },
    res,
  );
};

export default exports;
