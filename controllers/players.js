const { fetchPlayers, addPlayer, fetchPlayer, amendPlayer } = require("../models/players")
const { successMessage } = require("../utils/responses")

const NOTE_TYPE = 'note'
const TENDENCY_TYPE = 'tendency'

exports.getPlayers = async (req, res, next) => {
    const { group_id } = req.params
    const { limit, search } = req.query

    try {
        const players = await fetchPlayers(group_id, limit, search)
        res.send(successMessage({ players }))
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
        res.status(201).send(successMessage({ addedPlayer }))
    } catch (error) {
        next(error)
    }
}

exports.updatePlayer = async (req, res, next) => {

    const { group_id, player_id } = req.params
    const { username } = req.user

    try {
        const updatedPlayer = await amendPlayer(username, group_id, player_id, req.body)
        res.status(201).send(successMessage({ updatedPlayer }))
    } catch (error) {
        next(error)
    }
}
