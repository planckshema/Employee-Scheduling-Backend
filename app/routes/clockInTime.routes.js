  import clockInTimes from "../controllers/clockInTime.controller.js";
  import  authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new Clock In Time
  router.post("/", [authenticate], clockInTimes.create);

  export default router;

