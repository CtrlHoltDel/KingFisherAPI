const { fetchAdminUsers, fetchHistory, generateBackup } = require("../models/admin");
const { successMessage } = require("../utils/responses");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await fetchAdminUsers();
    res.send(successMessage({ users }))
  } catch (error) {
    next(error);
  }
};


exports.getHistory = async (req, res, next) => {
  try {
    const history = await fetchHistory()
    res.send(successMessage({ history }))
  } catch (error) {
    next(error)
  }
}

exports.createBackup = async(req, res , next) => {
  try {
    await generateBackup()
    res.download(`${__dirname.slice(0, -12)}/backup/backup.json`)
  } catch (error) {
    next(error)
  }
}