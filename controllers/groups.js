const { fetchGroups, insertGroup, requestGroupJoin, checkGroupRequests, handleUser } = require("../models/groups");

// Groups the user is part of.
exports.getGroups = async (req, res, next) => {
    const { username } = req.user

    try {
        const groups = await fetchGroups(username)
        res.status(200).send({ status: "success", data: { groups }});
    } catch (err) {
        next(err)
    }

}

// Adding a new group
exports.postGroup = async (req, res, next) => {
    const { username } = req.user
    const { body: { name } } = req

    try {
        const addedGroup = await insertGroup(username, name)
        res.status(201).send({ status: "success", data: { ...addedGroup } })
    } catch (err) {
        next(err)
    }
}

// Requesting to join a group
exports.postJoinGroup = async (req, res, next) => {
    const { query, user } = req

    try {
        const joinRequestApproved = await requestGroupJoin(query.group_id, user.username)
        res.status(201).send({ status: "success", data: { ...joinRequestApproved }})
    } catch (err) {
        next(err)
    }
}

// Getting requests to a users group
exports.getGroupRequests = async (req, res, next) => {
    const { user } = req;
    try {
        const groupRequests = await checkGroupRequests(user.username)
        res.status(200).send({ status: "success", data: { groupRequests }})
    } catch (err) {
        next(err)
    }
}

exports.postHandleUser = async (req, res, next) => {
    const { action } = req.body
    const { username: currentUsername } = req.user
    const { group_id } = req.params
    const { username } = req.query
    try {
        const response = await handleUser(currentUsername, action, group_id, username)
        res.status(201).send({ status: "success",  data: { message: `${username} added` }})
    } catch (err) {
        next(err)
    }
}