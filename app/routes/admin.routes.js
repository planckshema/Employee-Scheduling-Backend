import { Router } from "express";
import admin from "../controllers/admin.controller.js";

var router = Router();

router.post("/login", admin.login);

export default router;