const groupsRouter = require("express").Router();
const { getGroups, postGroup, postJoinGroup, postHandleUserRequest } = require("../controllers/groups");
const { groupValidation, groupValidationOnlyAdminAndOwner } = require("../middleware/middleware");

groupsRouter.route('/').get(getGroups).post(postGroup);
groupsRouter.route('/join').post(postJoinGroup)
groupsRouter.route('/handle-request/:group_id').post(groupValidationOnlyAdminAndOwner, postHandleUserRequest)

module.exports = groupsRouter;
