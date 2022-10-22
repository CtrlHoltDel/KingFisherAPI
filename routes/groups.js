const groupsRouter = require("express").Router();
const { getGroups, postGroup, postJoinGroup, getGroupRequests, postAcceptRequest, postHandleUser } = require("../controllers/groups");

groupsRouter.route('/').get(getGroups).post(postGroup);
groupsRouter.route('/join').post(postJoinGroup)
groupsRouter.route('/requests').get(getGroupRequests)
groupsRouter.route('/handle-request/:group_id').post(postHandleUser)

module.exports = groupsRouter;
