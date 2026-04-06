import taskLists from "../controllers/taskList.controller.js";
import { Router } from "express";

var router = Router();

router.post("/", taskLists.create);
router.get("/", taskLists.findAll);
router.put("/:id", taskLists.update);
router.delete("/:id", taskLists.delete);

export default router;
