const playersRouter = require("express").Router();

const { getPlayers } = require("../controllers/players");

playersRouter.route('/:group_id').get(getPlayers)

module.exports = playersRouter;
