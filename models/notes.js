const db = require("../db/connection");
const generateUUID = require("../utils/UUID");
const { noteTypeValid } = require("../utils/validation");

exports.fetchNotes = async (player_id) => {
    const { rows: notes } = await db.query(`SELECT note, created_time, created_by, type FROM notes WHERE player_id = $1`, [player_id]);
    const { rows: player } = await db.query(`SELECT * FROM players WHERE id = $1`, [player_id])
    return { notes, player: player[0] };
}

exports.postNote = async(username, player_id, note, type) => {
    if(!note || !noteTypeValid(type)) return Promise.reject({ status: 400, message: "Cannot Process Request"})

    const { rows: addedNote } = await db.query(`INSERT INTO notes (id, created_by, note, player_id, type) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_by, note, player_id, type`, [generateUUID(), username, note, player_id, type])
    return addedNote[0];
}