import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import TaskLists from "./taskList.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/taskLists", TaskLists);


export default router;
