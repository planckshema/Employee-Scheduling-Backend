import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import BusinessArea from "./businessArea.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/businessArea", BusinessArea);

export default router;
