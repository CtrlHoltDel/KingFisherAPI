const { fetchAdminGeneral } = require("../models/admin");
const { successMessage } = require("../utils/responses");

exports.getAdminGeneral = async (req, res, next) => {
  try {
    const response = await fetchAdminGeneral();
    console.log(successMessage({ message: "Wonderful" }))
    res.send({ status: successMessage })
  } catch (error) {
    next(error);
  }
};
