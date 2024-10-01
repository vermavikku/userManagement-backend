const express = require("express");
const cors = require("cors");
const db = require("./src/config/database");
require("dotenv").config();
const routes = require("./src/routes");

const app = express();

// Configure CORS
const corsOptions = {
  origin: "http://localhost:3039", // Adjust this to your frontend URL
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["X-Requested-With", "Authorization", "Role"],
  credentials: true, // Include this if you need to support cookies and authorization headers
};

// Use CORS middleware with options
app.use(cors(corsOptions));

// Use JSON middleware
app.use(express.json());

// Use your routes
app.use("/v1", routes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
