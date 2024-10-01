const express = require("express");
const router = express.Router();
const { clients } = require("../controllers");
const { authMiddleware } = require("../middlewares");

router.post("/", clients.addClientData);
router.get("/edit/:username", clients.getAllClientByUsername);
router.get("/dropdown", clients.getAllClientsDropdown);
router.delete("/:username", clients.deleteClientByUsername);
router.put("/", clients.updateClientByUsername);
router.get("/", clients.getAllClients);

module.exports = router;
