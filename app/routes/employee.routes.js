import employee from "../controllers/employee.controller.js";
import { Router } from "express";

var router = Router();

router.post("/", employee.create);
router.get("/", employee.findAll);
router.get("/:id", employee.findOne);
router.put("/:id", employee.update);
router.delete("/:id", employee.delete);

export default router;
