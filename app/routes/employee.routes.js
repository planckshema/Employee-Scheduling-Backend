import employee from "../controllers/employee.controller.js";
  import  authenticate from "../authorization/authorization.js";
  import { Router } from "express";
  var router = Router()


  // Create a new User
  router.post("/", [authenticate], employee.create);

  // Retrieve all People
  router.get("/", [authenticate], employee.findAll);

  // Retrieve a single Employee with id
  router.get("/:id", [authenticate], employee.findOne);

  // Update a Employee with id
  router.put("/:id", [authenticate], employee.update);

  // Delete a Employee with id
  router.delete("/:id", [authenticate], employee.delete);


  export default router;