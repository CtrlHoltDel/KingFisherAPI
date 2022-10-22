const playersRouter = require("express").Router();

const { getPlayers, postAddPlayer } = require("../controllers/players");

playersRouter.route('/:group_id').get(getPlayers)
playersRouter.route('/:group_id/:player_name').post(postAddPlayer)

module.exports = playersRouter;
