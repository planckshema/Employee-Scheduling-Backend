import db from "../models/index.js";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";

const Admin = db.admin;
const Employer = db.employer;
const Employee = db.employee;
const BusinessArea = db.businessArea;

export default {
  // ── Login ────────────────────────────────────────────────────────
  async login(req, res) {
    try {
      const username = req.body.username ? req.body.username.trim() : "";
      const password = req.body.password;

      const admin = await Admin.findOne({ where: { username } });
      if (!admin || password !== admin.password) {
        return res.status(401).json({ message: "Invalid username or password." });
      }

      const token = jwt.sign(
        { id: admin.id, isAdmin: true },
        authConfig.secret,
        { expiresIn: "8h" }
      );

      res.json({ token, isAdmin: true, username: admin.username });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error." });
    }
  },

  // ── Stats ────────────────────────────────────────────────────────
  async getStats(req, res) {
    try {
      const totalEmployers = await Employer.count();
      const totalEmployees = await Employee.count();
      const totalAreas     = await BusinessArea.count();

      res.json({
        totalUsers: totalEmployers + totalEmployees,
        totalEmployers,
        totalEmployees,
        totalAreas,
        systemStatus: "Online",
      });
    } catch (err) {
      console.error("STATS ERROR:", err.message);
      res.status(500).json({ message: "Database column mismatch in Stats." });
    }
  },

  // ── Get All Users (The Hierarchy) ────────────────────────────────
  async getUsers(req, res) {
    try {
      const data = await BusinessArea.findAll({
        // Matching your screenshot: AreaId, Name
        attributes: ["AreaId", "Name"], 
        include: [
          {
            model: Employer,
            // Matching your screenshot: employerid, businessName, firstName...
            attributes: ["employerid", "businessName", "firstName", "lastName", "email"],
            include: [
              {
                model: Employee,
                as: "staff", // This must match the alias in models/index.js
                attributes: ["EmployeeID", "firstName", "lastName", "email"]
              }
            ]
          }
        ]
      });
      res.json(data);
    } catch (err) {
      console.error("GET USERS ERROR:", err.message);
      res.status(500).json({ message: err.message });
    }
  },

  // ── Create Employer ──────────────────────────────────────────────
  async createUser(req, res) {
    try {
      const { firstName, lastName, email, businessName, AreaId } = req.body;
      const employer = await Employer.create({
        firstName,
        lastName,
        email,
        businessName,
        AreaId 
      });
      res.status(201).json(employer);
    } catch (err) {
      res.status(500).json({ message: "Could not create record." });
    }
  },

  // ── Delete Employer ──────────────────────────────────────────────
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const employer = await Employer.findByPk(id);
      if (!employer) return res.status(404).json({ message: "Not found." });
      await employer.destroy();
      res.json({ message: "Deleted successfully." });
    } catch (err) {
      res.status(500).json({ message: "Could not delete." });
    }
  },

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, businessName } = req.body;
      const employer = await Employer.findByPk(id);
      
      if (!employer) return res.status(404).json({ message: "Not found" });

      await employer.update({ firstName, lastName, email, businessName });
      res.json({ message: "Updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  },
};