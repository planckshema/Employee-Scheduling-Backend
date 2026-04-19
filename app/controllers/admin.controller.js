import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";

export default {

  // ── Login ────────────────────────────────────────────────────────
  async login(req, res) {
    const username = req.body.username ? req.body.username.trim() : "";
    const password = req.body.password;

    console.log(`--- Login Attempt: ${username} ---`);

    try {
      const admin = await Admin.findOne({ where: { username } });

      if (!admin) {
        return res.status(401).json({ message: "Invalid username or password." });
      }

      if (password !== admin.password) {
        return res.status(401).json({ message: "Invalid username or password." });
      }

      const token = jwt.sign(
        { id: admin.id, isAdmin: true },
        authConfig.secret,
        { expiresIn: "8h" }
      );

      res.json({ token, isAdmin: true, username: admin.username });

    } catch (err) {
      console.error("DATABASE ERROR:", err.message);
      res.status(500).json({ message: "Internal Server Error." });
    }
  },

  // ── Stats ────────────────────────────────────────────────────────
  async getStats(req, res) {
    try {
      // Adjust these queries to match your actual User model/fields
      const totalUsers     = await User.count();
      const activeUsers    = await User.count({ where: { status: "active" } });
      const totalEmployers = await User.count({ where: { role: "employer" } });
      const totalEmployees = await User.count({ where: { role: "employee" } });

      res.json({
        totalUsers,
        activeUsers,
        totalEmployers,
        totalEmployees,
        systemStatus: "Online",
      });
    } catch (err) {
      console.error("STATS ERROR:", err.message);
      res.status(500).json({ message: "Could not load stats." });
    }
  },

  // ── Get All Users ────────────────────────────────────────────────
  async getUsers(req, res) {
    try {
      const { search, role, status } = req.query;

      // Build a where clause - adjust based on your ORM (Sequelize shown here)
      const where = {};
      if (role)   where.role   = role;
      if (status) where.status = status;

      let users = await User.findAll({
        where,
        // Include employees if you have an association set up:
        // include: [{ model: User, as: "employees" }],
        attributes: ["id", "name", "email", "role", "status", "createdAt"],
      });

      // Apply search filter in JS (or move to SQL with Op.like if preferred)
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
      }

      res.json(users);
    } catch (err) {
      console.error("GET USERS ERROR:", err.message);
      res.status(500).json({ message: "Could not load users." });
    }
  },

  // ── Create User ──────────────────────────────────────────────────
  async createUser(req, res) {
    const { name, email, role, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    try {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: "A user with that email already exists." });
      }

      const user = await User.create({
        name,
        email,
        role:   role   || "employee",
        status: status || "active",
      });

      res.status(201).json(user);
    } catch (err) {
      console.error("CREATE USER ERROR:", err.message);
      res.status(500).json({ message: "Could not create user." });
    }
  },

  // ── Update User ──────────────────────────────────────────────────
  async updateUser(req, res) {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    try {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: "User not found." });

      // Check email isn't taken by someone else
      if (email && email !== user.email) {
        const conflict = await User.findOne({ where: { email } });
        if (conflict) {
          return res.status(409).json({ message: "That email is already in use." });
        }
      }

      await user.update({ name, email, role, status });
      res.json(user);
    } catch (err) {
      console.error("UPDATE USER ERROR:", err.message);
      res.status(500).json({ message: "Could not update user." });
    }
  },

  // ── Delete User ──────────────────────────────────────────────────
  async deleteUser(req, res) {
    const { id } = req.params;

    try {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ message: "User not found." });

      await user.destroy();
      res.json({ message: "User deleted successfully." });
    } catch (err) {
      console.error("DELETE USER ERROR:", err.message);
      res.status(500).json({ message: "Could not delete user." });
    }
  },
};