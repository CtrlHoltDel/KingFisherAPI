const { getAdminUsers } = require("../controllers/admin");

const adminRouter = require("express").Router();

adminRouter.route('/users').get(getAdminUsers)

module.exports = adminRouter;
