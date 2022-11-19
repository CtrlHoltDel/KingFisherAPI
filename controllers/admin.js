const { fetchAdminUsers, fetchHistory } = require("../models/admin");
const { successMessage } = require("../utils/responses");

exports.getAdminUsers = async (req, res, next) => {
  try {
    const users = await fetchAdminUsers();
    res.send(successMessage({ users }))
  } catch (error) {
    next(error);
  }
};


exports.getHistory = async (req, res, next) => {
  const history = await fetchHistory()
  res.send(successMessage({ history }))
}