const { getNotes, addNote } = require("../controllers/notes");
const { playerValidation } = require("../middleware/middleware");

const notesRouter = require("express").Router();

notesRouter.route('/:player_id').get(playerValidation, getNotes).post(playerValidation, addNote)

module.exports = notesRouter;
