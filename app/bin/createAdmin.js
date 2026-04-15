import Admin from "../models/admin.model.js";
import bcrypt from "bcrypt";
import sequelize from "../config/sequelizeInstance.js"; 

await sequelize.sync();

const username = "admin";
const password = "yourpassword"; 

const hash = await bcrypt.hash(password, 10);
await Admin.create({ username, password: hash });

console.log("Admin account created successfully.");
process.exit();