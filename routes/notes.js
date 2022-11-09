const { getNotes, addNote, delNote } = require("../controllers/notes");
const { groupValidation } = require("../middleware/middleware");

const notesRouter = require("express").Router();

notesRouter.route('/:player_id').get(groupValidation, getNotes).post(groupValidation, addNote)
notesRouter.route('/:note_id').delete(groupValidation, delNote)

module.exports = notesRouter;
