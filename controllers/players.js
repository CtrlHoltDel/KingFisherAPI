const { fetchPlayers, addPlayer, fetchPlayer, amendPlayer } = require("../models/players")

exports.getPlayers = async (req, res, next) => {
    const { group_id } = req.params
    const { username } = req.user
    const { limit, search } = req.query

    try {
        const players = await fetchPlayers(group_id, username, limit, search)
        res.send({ status: "success", data: { players }})
    } catch (error) {
        next(error)
    }
}

exports.getPlayer = async (req, res, next) => {
    const { group_id, player_id } = req.params
    const { username } = req.user

    try {
        const player = await fetchPlayer(group_id, username, player_id)
        res.send({ status: "success", data: { player } })
    } catch (error) {
        next(error)
    }
}

exports.postAddPlayer = async(req, res, next) => {
    const { group_id } = req.params
    const { username } = req.user
    const { playerName } = req.body 
    
    try {
        const addedPlayer = await addPlayer(username, group_id, playerName)
        res.status(201).send({ status: "success", data: { addedPlayer: addedPlayer[0] } })
    } catch (error) {
        next(error)
    }
}

exports.updatePlayer = async (req, res, next) => {

    const { group_id, player_id } = req.params
    const { username } = req.user

    try {
        const updatedPlayer = await amendPlayer(username, group_id, player_id, req.body)
        res.status(201).send({ status: "success", data: { updatedPlayer }})
    } catch (error) {
        next(error)
    }
}
