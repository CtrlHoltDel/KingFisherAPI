const { getAdminGeneral } = require("../controllers/admin");

const adminRouter = require("express").Router();

adminRouter.route('/').get(getAdminGeneral)

module.exports = adminRouter;
