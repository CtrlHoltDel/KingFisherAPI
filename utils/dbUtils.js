const db = require("../db/connection")

exports.checkGroupOwnership = async (username, groupId) => {
    const { rows } = await db.query(`SELECT name FROM note_group WHERE note_group.created_by = $1 AND id = $2`, [username, groupId])
    if(rows.length) return
    return Promise.reject({ status: 400, message: "Error Handling Request" })
}

// Checking group validity with username and noteId
exports.checkGroupStatus = async (username, noteGroupId) => {
    const { rows } = await db.query(`SELECT username, validated, admin FROM note_group_junction WHERE username = $1 AND note_group = $2`, [username, noteGroupId])
    if(!rows.length || !rows[0].validated) return Promise.reject({ status: 400, message: "Error Handling Request" })
}

// Checking group validity with the username and player id
exports.checkGroupValidity = async (username, playerId) => {
    const { rows: validityCheck } = await db.query(`SELECT validated FROM note_group_junction ngj JOIN players ON players.note_group_id = ngj.note_group WHERE ngj.username = $1 AND players.id = $2`, [username, playerId]);
    if(!validityCheck.length || !validityCheck[0].validated) return Promise.reject({ status: 400, message: "Cannot Process Request" })
}