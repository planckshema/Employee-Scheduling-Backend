  import shifts from "../controllers/shift.controller.js";
  import authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new Shift
  router.post("/", [authenticate], shifts.create);

  export default router;

