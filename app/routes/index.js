import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import PositionRoutes from "./position.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/positions", Positions);


export default router;
