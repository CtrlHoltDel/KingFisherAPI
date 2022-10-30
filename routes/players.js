const playersRouter = require("express").Router();

const { getPlayers, postAddPlayer, getPlayer, updatePlayer } = require("../controllers/players");

// TODO: Add middleware to these routes
playersRouter.route('/:group_id').get(getPlayers).post(postAddPlayer)
playersRouter.route('/:group_id/:player_id').get(getPlayer).put(updatePlayer)

module.exports = playersRouter;
