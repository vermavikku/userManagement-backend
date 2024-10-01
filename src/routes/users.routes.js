const express = require("express");
const router = express.Router();
const {users} = require("../controllers");
const {authMiddleware} = require("../middlewares");

// router.use(authMiddleware)

router.post("/",users.addUserData);
router.get("/",users.getUsersList);

module.exports = router