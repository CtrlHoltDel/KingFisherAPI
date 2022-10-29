const playersRouter = require("express").Router();

const { getPlayers, postAddPlayer, getPlayer } = require("../controllers/players");

playersRouter.route('/:group_id').get(getPlayers)
playersRouter.route('/:group_id/:player_name').post(postAddPlayer)
playersRouter.route('/:group_id/:player_id').get(getPlayer)

module.exports = playersRouter;
