  import taskListItems from "../controllers/taskListItem.controller.js";
  import  authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new User
  router.post("/", [authenticate], taskListItems.create);


  export default router;

