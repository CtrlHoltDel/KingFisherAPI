const db = require("../db/connection");
const { trackAddNote, trackArchiveNote } = require("../utils/historyTracking");
const generateUUID = require("../utils/UUID");
const { noteTypeValid } = require("../utils/validation");

const NOTE_TYPE = 'note'
const TENDENCY_TYPE = 'tendency'

exports.fetchNotes = async (player_id) => {
    const { rows: allTendenciesAndNotes } = await db.query(`SELECT note, created_time, created_by, type, id FROM notes WHERE player_id = $1 AND (type = $2 OR type = $3) AND archived = $4 ORDER BY created_time ASC`, [player_id, TENDENCY_TYPE, NOTE_TYPE, false]);
    const { rows: player } = await db.query(`SELECT * FROM players WHERE id = $1`, [player_id])
    
    const notes = allTendenciesAndNotes.filter(note => note.type === NOTE_TYPE)
    const tendencies = allTendenciesAndNotes.filter(note => note.type === TENDENCY_TYPE)
    
    return { notes, tendencies, player: player[0] };
}

exports.postNote = async(username, player_id, note, type) => {
    if(!note || !noteTypeValid(type)) return Promise.reject({ status: 400, message: "Cannot Process Request"})

    const { rows: addedNote } = await db.query(`INSERT INTO notes (id, created_by, note, player_id, type) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_by, note, player_id, type`, [generateUUID(), username, note, player_id, type])

    await trackAddNote(type, username, player_id, note, addedNote[0].id)


    return addedNote[0];
}

exports.removeNote = async(username, noteId) => {
    const { rows: archivedNote } = await db.query(`UPDATE notes SET archived = $1 WHERE id = $2 RETURNING *`, [true, noteId])
    await trackArchiveNote(noteId, username, archivedNote[0].type, archivedNote[0].note, archivedNote[0].player_id)
}