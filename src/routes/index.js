const express = require("express");
const router = express.Router();
const users = require("./users.routes");
const auth = require("./auth.routes");
const clients = require("./clients.routes");
const customers = require("./customers.routes");

router.use("/users",users)
router.use("/auth",auth)
router.use("/clients",clients)
router.use("/customers",customers)

module.exports = router;