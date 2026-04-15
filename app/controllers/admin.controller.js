import Admin from "../models/admin.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";

export default {
  async login(req, res) {
    const { username, password } = req.body;

    // DEBUG 1: See what the frontend is actually sending
    console.log("Login attempt for:", username);

    try {
      // Sequelize will try to find 'admins' based on your model name
      const admin = await Admin.findOne({ where: { username } });

      if (!admin) {
        // DEBUG 2: If this hits, the table is empty or the username is wrong
        console.log("User not found in database.");
        return res.status(401).json({ message: "Invalid credentials." });
      }

      // DEBUG 3: See the hash we found in the DB
      console.log("User found. Comparing passwords...");

      const match = await bcrypt.compare(password, admin.password);
      if (!match) {
        // DEBUG 4: If this hits, the password you typed doesn't match the hash
        console.log("Password mismatch for user:", username);
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const token = jwt.sign(
        { id: admin.id, isAdmin: true },
        authConfig.secret,
        { expiresIn: "8h" }
      );

      console.log("Login successful! Token generated.");
      res.json({ token, isAdmin: true });

    } catch (err) {
      // This will now show the REAL error (like "Table 'schedule.admin' doesn't exist")
      console.error("DATABASE OR SYSTEM ERROR:", err); 
      res.status(500).json({ message: "Server error." });
    }
  },
};