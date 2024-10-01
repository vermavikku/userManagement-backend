const users = require("./users.controllers");
const auth = require("./auth.controllers");
const clients = require("./clients.controllers");
const customers = require("./customers.controllers");
module.exports = {
    users,
    auth,
    clients,
    customers
}