const playersRouter = require("express").Router();

const { getPlayers, postAddPlayer, getPlayer, updatePlayer } = require("../controllers/players");
const { groupValidation, playerValidation } = require("../middleware/middleware");

// TODO remove unused get-player route
playersRouter.route('/get-player/:player_id').get(playerValidation, getPlayer)
playersRouter.route('/:group_id').get(groupValidation, getPlayers).post(groupValidation, postAddPlayer)
playersRouter.route('/:group_id/:player_id').put(groupValidation, updatePlayer)



module.exports = playersRouter;
