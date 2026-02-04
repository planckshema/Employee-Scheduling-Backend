import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import TaskListItemRoutes from "./taskListItem.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/taskListItems", TaskListItemRoutes);


export default router;
