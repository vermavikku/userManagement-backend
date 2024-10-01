const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./src/config/database");
require("dotenv").config();
const routes = require("./src/routes");

const corsOptions = {
  origin:
    "https://66fb99b750fb4dc835e870c8--delicate-zuccutto-0d802e.netlify.app", // Allow only your front-end URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow all methods
  credentials: true, // Allow credentials if needed (like cookies)
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/v1", routes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
