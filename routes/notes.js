const { getNotes, addNote } = require("../controllers/notes");
const { groupValidation } = require("../middleware/middleware");

const notesRouter = require("express").Router();

notesRouter.route('/:player_id').get(groupValidation, getNotes).post(groupValidation, addNote)

module.exports = notesRouter;
