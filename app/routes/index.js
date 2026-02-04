import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import NotificationRoutes from "./notification.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("notifications", NotificationRoutes);


export default router;