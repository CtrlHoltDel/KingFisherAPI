const { fetchPlayers, addPlayer, fetchPlayer } = require("../models/players")

exports.getPlayers = async (req, res, next) => {
    const { group_id } = req.params
    const { username } = req.user

    try {
        const players = await fetchPlayers(group_id, username)
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
    const { group_id, player_name } = req.params
    const { username } = req.user
    
    try {
        const addedPlayer = await addPlayer(username, group_id, player_name)
        res.status(201).send({ status: "success", data: { addedPlayer: addedPlayer[0] } })
    } catch (error) {
        next(error)
    }
}
