import { Router } from "express";
import db from "../models/index.js";

const router = Router();

router.get("/users/:id/availability", async (req, res) => {
  const availability = await db.employeeAvailability.findOne({
    where: { userId: req.params.id }
  });

  res.json(availability);
});

router.put("/users/:id/availability", async (req, res) => {
  const { availabilityText } = req.body;

  const [row] = await db.employeeAvailability.upsert({
    userId: req.params.id,
    availabilityText
  });

  res.json(row);
});

export default router;
