  import taskLists from "../controllers/taskList.controller.js";
  import  authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new User
  router.post("/", [authenticate], taskLists.create);


  export default router;

