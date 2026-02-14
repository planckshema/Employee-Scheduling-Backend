  import clockOutTimes from "../controllers/clockOutTime.controller.js";
  import  authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new User
  router.post("/", [authenticate], clockOutTimes.create);

  export default router;

