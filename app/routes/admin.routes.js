import { Router } from "express";
import admin from "../controllers/admin.controller.js";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";

const router = Router(); // Use const instead of var

// ── Middleware: verify JWT and check isAdmin ──────────────────────
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, authConfig.secret);
    if (!decoded.isAdmin) return res.status(403).json({ message: "Admin access required." });
    req.adminUser = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

router.post("/login",          admin.login);
router.get("/stats",           requireAdmin, admin.getStats);
router.get("/users",           requireAdmin, admin.getUsers);
router.post("/users",          requireAdmin, admin.createUser);
router.put("/users/:id",       requireAdmin, admin.updateUser);
router.delete("/users/:id",    requireAdmin, admin.deleteUser);

export default router; // Ensure this is the only export