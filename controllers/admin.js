const { fetchAdminUsers } = require("../models/admin");
const { successMessage } = require("../utils/responses");

exports.getAdminUsers = async (req, res, next) => {
  try {
    const response = await fetchAdminUsers();
    console.log(successMessage({ message: "Wonderful" }))
    res.send({ status: successMessage })
  } catch (error) {
    next(error);
  }
};
