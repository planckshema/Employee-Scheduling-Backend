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
    // We use the model names defined in your db object
    const data = await db.employer.findAll({
      attributes: ["employerid", "businessName", "firstName", "lastName", "email"],
      include: [
        {
          model: db.employee,
          as: "staff", // This MUST match the 'as' in models/index.js
          attributes: ["EmployeeID", "firstName", "lastName", "email"]
        }
      ]
    });
    res.json(data);
  } catch (err) {
    // print the EXACT error to console
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

  async deleteUser(req, res) {
    try {
      await Employer.destroy({ where: { employerid: req.params.id } });
      res.json({ message: "Employer removed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting employer" });
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