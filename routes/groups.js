const groupsRouter = require("express").Router();
const { getGroups, postGroup, postJoinGroup, postHandleUserRequest } = require("../controllers/groups");
const { groupValidationAdmin } = require("../middleware/middleware");

groupsRouter.route('/').get(getGroups).post(postGroup);
groupsRouter.route('/join').post(postJoinGroup)
groupsRouter.route('/handle-request/:group_id').post(groupValidationAdmin, postHandleUserRequest)

module.exports = groupsRouter;
