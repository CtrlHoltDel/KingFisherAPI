const { fetchGroups, insertGroup, requestGroupJoin, checkGroupRequests, handleUserRequest } = require("../models/groups");
const { successMessage } = require("../utils/responses");

exports.getGroups = async (req, res, next) => {
    const { username } = req.user

    try {
        const groups = await fetchGroups(username)
        res.status(200).send(successMessage({ groups }));
    } catch (err) {
        next(err)
    }

}

exports.postGroup = async (req, res, next) => {
    const { username } = req.user
    const { name: newGroupName } = req.body

    try {
        const addedGroup = await insertGroup(username, newGroupName)
        res.status(201).send(successMessage({ addedGroup }))
    } catch (err) {
        next(err)
    }
}

exports.postJoinGroup = async (req, res, next) => {
    const { query, user } = req

    try {
        const joinRequestApproved = await requestGroupJoin(query.group_id, user.username)
        res.status(201).send(successMessage(joinRequestApproved))
    } catch (err) {
        next(err)
    }
}

exports.postHandleUserRequest = async (req, res, next) => {
    const { action } = req.body
    const { username: currentUsername } = req.user
    const { group_id } = req.params
    const { username } = req.query
    try {
        const message = await handleUserRequest(currentUsername, action, group_id, username)
        res.status(201).send(successMessage({ message }))
    } catch (err) {
        next(err)
    }
}