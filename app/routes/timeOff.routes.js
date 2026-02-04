  import timeOffs from "../controllers/timeOff.controller.js";
  import  authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new User
  router.post("/", [authenticate], timeOffs.create);

  export default router;

