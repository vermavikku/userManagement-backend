const express = require("express");
const cors = require("cors");
const db = require("./src/config/database");
require("dotenv").config();
const routes = require("./src/routes");

const app = express();

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["X-Requested-With", "Authorization", "Role"],
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/v1", routes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
