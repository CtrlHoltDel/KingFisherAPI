const { fetchAdminUsers, fetchHistory, generateBackup, generateHistoryBackup, updateUser, fetchGroupsAdmin, fetchSingleGroupAdmin, fetchAdminNotes } = require("../models/admin");
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
  const { type, action } = req.query
  try {
    const history = await fetchHistory(type, action)
    res.send(successMessage({ history }))
  } catch (error) {
    next(error)
  }
}

exports.createBackup = async(req, res , next) => {
  try {
    await generateBackup()
    res.sendFile(`${__dirname.slice(0, -12)}/backup/backup.json`)
  } catch (error) {
    next(error)
  }
}

exports.createHistoryBackup = async (req, res, next) => {
  try {
    const history = await generateHistoryBackup()
    res.send(successMessage({ history }))
  } catch (error) {
    next(error)
  }
}

exports.patchUser = async (req, res, next) => {

  const { username } = req.params;
  
  try {
    const response = await updateUser(username)
    res.status(201).send(successMessage(response))
  } catch (error) {
    next(error)
  }

}

exports.getGroupsAdmin = async (req, res, next) => {
  try {
    const groups = await fetchGroupsAdmin()
    res.send(successMessage({ groups }))
  } catch (error) {
    next(error)
  }
}

exports.getSingleGroupAdmin = async (req, res, next) => {
  const { group_id } = req.params;
  try {
    const group = await fetchSingleGroupAdmin(group_id)
    res.send(successMessage({ group }))
  } catch (error) {
    next(error)
  }
}

exports.getAdminNotes = async (req, res, next) => {
  const { archived } = req.query
  const { username } = req.params

  try {
    const notes = await fetchAdminNotes(archived, username);
    res.send(successMessage({ notes }))
  } catch (error) {
    next(error)
  }
}