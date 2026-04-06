import shifts from "../controllers/shift.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

router.get("/", shifts.findAll);
router.post("/", [authenticate], shifts.create);
router.put("/:id", [authenticate], shifts.update);
router.delete("/:id", [authenticate], shifts.delete);

export default router;
