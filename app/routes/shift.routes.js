import shifts from "../controllers/shift.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router()

// GET all shifts
// Changed to call the controller function you just wrote
router.get('/', shifts.findAll); 

// Create a new Shift
router.post("/", [authenticate], shifts.create);

router.delete("/:id", [authenticate], shifts.delete);

export default router;