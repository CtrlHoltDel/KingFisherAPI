const { fetchPlayers } = require("../models/players")

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