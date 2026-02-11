  import taskStatus from "../controllers/user.controller.js";
  import  authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new User
  router.post("/", [authenticate], taskStatus.create);


  export default router;

