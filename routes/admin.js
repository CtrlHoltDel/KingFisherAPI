const { getUsers, getHistory, createBackup, createHistoryBackup } = require("../controllers/admin");

const adminRouter = require("express").Router();

adminRouter.route('/users').get(getUsers)
adminRouter.route('/history').get(getHistory)
adminRouter.route('/backup').get(createBackup)
adminRouter.route('/backup/history').get(createHistoryBackup)

module.exports = adminRouter;
