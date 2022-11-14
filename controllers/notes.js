const { fetchNotes, postNote, removeNote } = require("../models/notes")
const { successMessage } = require("../utils/responses")

exports.getNotes = async (req, res, next) => {
    const { player_id } = req.params

    try {
        const { notes, player, tendencies } = await fetchNotes(player_id)
        res.send(successMessage({ notes, player, tendencies }))
    } catch (error) {
        next(error)
    }
}

exports.addNote = async (req, res, next) => {
    const { username } = req.user
    const { player_id } = req.params
    const { note, type } = req.body

    try {
        const addedNote = await postNote(username, player_id, note, type)
        res.status(201).send(successMessage({ addedNote }))
    } catch (error) {
        next(error)
    }
}

exports.delNote = async (req, res, next) => {
    const { note_id } = req.params

    try {
        await removeNote(note_id)
        res.send(successMessage({ message: `Note ${note_id} deleted`}))
    } catch (error) {
        next(error)
    }

}