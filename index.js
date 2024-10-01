const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./src/config/database");
require("dotenv").config();
const routes = require("./src/routes");

app.use(cors());

app.use(express.json());

app.use("/v1", routes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
