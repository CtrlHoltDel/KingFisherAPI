const { fetchNotes, postNote } = require("../models/notes")

exports.getNotes = async (req, res, next) => {
    const { player_id } = req.params

    try {
        const { notes, player } = await fetchNotes(player_id)
        res.send({ status: "success", data: { notes, player }})
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
        res.status(201).send({ status: "success", data: { addedNote }})
    } catch (error) {
        next(error)
    }

}