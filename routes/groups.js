const groupsRouter = require("express").Router();
const { getGroups, postGroup, postJoinGroup, getGroupRequests, postAcceptRequest } = require("../controllers/groups");

groupsRouter.route('/').get(getGroups).post(postGroup);
groupsRouter.route('/join').post(postJoinGroup)
groupsRouter.route('/requests').get(getGroupRequests)
groupsRouter.route('/handle-request').post(postAcceptRequest)

module.exports = groupsRouter;
