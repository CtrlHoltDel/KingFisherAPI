const groupsRouter = require("express").Router();
const { getGroups, postGroup, postJoinGroup } = require("../controllers/groups");


groupsRouter.route('/').get(getGroups).post(postGroup);
groupsRouter.route('/join').post(postJoinGroup)

module.exports = groupsRouter;
