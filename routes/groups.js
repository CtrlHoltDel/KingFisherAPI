const groupsRouter = require("express").Router();
const { getGroups, postGroup, postJoinGroup, getGroupRequests, postHandleUserRequest } = require("../controllers/groups");

groupsRouter.route('/').get(getGroups).post(postGroup);
groupsRouter.route('/join').post(postJoinGroup)
groupsRouter.route('/requests').get(getGroupRequests)
groupsRouter.route('/handle-request/:group_id').post(postHandleUserRequest)

module.exports = groupsRouter;
