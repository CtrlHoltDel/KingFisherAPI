const { getAdminUsers, getHistory } = require("../controllers/admin");

const adminRouter = require("express").Router();

adminRouter.route('/users').get(getAdminUsers)
adminRouter.route('/history').get(getHistory)

module.exports = adminRouter;
