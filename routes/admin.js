const { getUsers, getHistory, createBackup, createHistoryBackup, patchUser } = require("../controllers/admin");

const adminRouter = require("express").Router();

adminRouter.route('/users').get(getUsers)
adminRouter.route('/history').get(getHistory)
adminRouter.route('/backup').get(createBackup)
adminRouter.route('/backup/history').get(createHistoryBackup)
adminRouter.route('/user/:username').post(patchUser)

module.exports = adminRouter;
