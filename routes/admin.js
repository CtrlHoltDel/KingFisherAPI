const { getUsers, getHistory, createBackup, createHistoryBackup, patchUser, getGroupsAdmin, getSingleGroupAdmin } = require("../controllers/admin");

const adminRouter = require("express").Router();

adminRouter.route('/users').get(getUsers)
adminRouter.route('/history').get(getHistory)
adminRouter.route('/backup').get(createBackup)
adminRouter.route('/backup/history').get(createHistoryBackup)
adminRouter.route('/user/:username').post(patchUser)
adminRouter.route('/groups').get(getGroupsAdmin)
adminRouter.route('/groups/:group_id').get(getSingleGroupAdmin)

module.exports = adminRouter;
