import shifts from "../controllers/shift.controller.js";
import { Router } from "express";

var router = Router();

router.post("/", shifts.create);
router.get("/", shifts.findAll);
router.put("/:id", shifts.update);
router.delete("/:id", shifts.delete);

export default router;
