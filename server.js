import "dotenv/config";
import routes from "./app/routes/index.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import db from "./app/models/index.js";
import logger from "./app/config/logger.js";

db.sequelize.sync({ alter: true });

const app = express();

// HTTP request logger middleware
app.use(morgan("combined", { stream: logger.stream }));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Load the routes from the routes folder
app.use("/workerscheduling-t8", routes);


// set port, listen for requests
const rawPort = String(process.env.PORT || "3100").trim().replace(/;$/, "");
const PORT = Number.parseInt(rawPort, 10) || 3100;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

// Export logger for use in other modules
export { logger };

export default app;
