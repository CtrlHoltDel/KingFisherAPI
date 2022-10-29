const { getNotes, addNote } = require("../controllers/notes");

const notesRouter = require("express").Router();

notesRouter.route('/:player_id').get(getNotes).post(addNote)

module.exports = notesRouter;
