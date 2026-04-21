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
      // Modified to ensure the associated employees are actually returned
      const data = await Employer.findAll({
        include: [
          {
            model: Employee,
            // We use "staff" because your original code used it, 
            // but we allow Sequelize to return all columns so fName/lName aren't lost
            as: "staff", 
          }
        ]
      });
      res.json(data);
    } catch (err) {
      console.error("DATABASE ERROR:", err.message);
      res.status(500).json({ message: err.message });
    }
  },

  // ── Create Employer ──────────────────────────────────────────────
  async createUser(req, res) {
    try {
      const employer = await Employer.create(req.body);
      res.status(201).json(employer);
    } catch (err) {
      res.status(500).json({ message: "Error creating employer" });
    }
  },

  // ── Delete Employer ──────────────────────────────────────────────
  async deleteUser(req, res) {
    try {
      await Employer.destroy({ where: { employerid: req.params.id } });
      res.json({ message: "Employer removed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting employer" });
    }
  },

  // ── Update Employer ──────────────────────────────────────────────
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, businessName, location } = req.body;
      const employer = await Employer.findByPk(id);
      
      if (!employer) return res.status(404).json({ message: "Not found" });

      await employer.update({ firstName, lastName, email, businessName, location });
      res.json({ message: "Updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  },

  // ── Delete Employee (Staff) ──────────────────────────────────────
  async deleteEmployee(req, res) {
    try {
      const { id } = req.params;
      await Employee.destroy({ where: { EmployeeID: id } });
      res.json({ message: "Staff member removed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting staff member" });
    }
  }
};