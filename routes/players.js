const playersRouter = require("express").Router();

const { getPlayers, postAddPlayer, getPlayer, updatePlayer } = require("../controllers/players");
const { groupValidation } = require("../middleware/middleware");

playersRouter.route('/:group_id').get(groupValidation, getPlayers).post(groupValidation, postAddPlayer)
playersRouter.route('/:group_id/:player_id').get(groupValidation, getPlayer).put(groupValidation, updatePlayer)



module.exports = playersRouter;
