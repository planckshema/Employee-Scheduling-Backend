import Admin from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";

export default {
  async login(req, res) {
    // .trim() helps prevent "User not found" due to accidental spaces
    const username = req.body.username ? req.body.username.trim() : "";
    const password = req.body.password;

    console.log(`--- Login Attempt: ${username} ---`);

    try {
      const admin = await Admin.findOne({ where: { username } });

      if (!admin) {
        console.log("Result: [401] Username not found in database.");
        return res.status(401).json({ message: "Invalid username or password." });
      }

      // Plain text comparison check
      if (password !== admin.password) {
        console.log("Result: [401] Password mismatch.");
        // We send the same message for security so hackers don't know which part was wrong
        return res.status(401).json({ message: "Invalid username or password." });
      }

      // Generate Token
      const token = jwt.sign(
        { id: admin.id, isAdmin: true },
        authConfig.secret,
        { expiresIn: "8h" }
      );

      console.log("Result: [200] Login successful! Token generated.");
      
      // Send the user data back to the frontend
      res.json({ 
        token, 
        isAdmin: true,
        username: admin.username 
      });

    } catch (err) {
      console.error("DATABASE ERROR:", err.message);
      res.status(500).json({ message: "Internal Server Error." });
    }
  },
};