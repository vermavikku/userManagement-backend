const express = require("express");
const router = express.Router();
const {auth} = require("../controllers");

router.post("/",auth.logInUser);

module.exports = router;