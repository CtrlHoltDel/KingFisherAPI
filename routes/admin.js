const { getUsers, getHistory, createBackup } = require("../controllers/admin");

const adminRouter = require("express").Router();

adminRouter.route('/users').get(getUsers)
adminRouter.route('/history').get(getHistory)
adminRouter.route('/backup').get(createBackup)

module.exports = adminRouter;
