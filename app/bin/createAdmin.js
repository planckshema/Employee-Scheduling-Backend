import Admin from "../models/admin.model.js";
import sequelize from "../config/sequelizeInstance.js"; 

await sequelize.sync();

const username = "admin";
const password = "password"; 

await Admin.create({ 
  username: username, 
  password: password 
});

console.log("Admin account created successfully (Plain Text).");
process.exit();