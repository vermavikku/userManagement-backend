const express = require("express");
const router = express.Router();
const { customers } = require("../controllers");
const { authMiddleware } = require("../middlewares");

router.post("/", customers.addCustomerData);
router.delete("/:username", customers.deleteCustomerByUsername);
router.put("/", customers.updateCustomersByUsername);
router.get("/edit/:username", customers.getAllCustomersByUsername);
router.use(authMiddleware);
router.get("/", customers.getAllCustomers);

module.exports = router;
