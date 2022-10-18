const { fetchGroups, insertGroup, requestGroupJoin } = require("../models/groups")

exports.getGroups = async (req, res, next) => {
    const { username } = req.user

    try {
        const response = await fetchGroups(username)
        res.status(200).send(response);
    } catch (err) {
        next(err)
    }
}

exports.postGroup = async (req, res, next) => {
    const { username } = req.user
    const { body: { name } } = req

    try {
        const response = await insertGroup(username, name)

        console.log(response)
        res.status(201).send(response)
    } catch (err) {
        next(err)
    }
}

exports.postJoinGroup = async (req, res, next) => {
    const { query, user } = req

    try {
        await requestGroupJoin(query.name, user.username)
        res.status(201).send("test")
    } catch (err) {
        next(err)
    }
}