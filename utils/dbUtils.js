const db = require("../db/connection")

// Checking group validity with username and noteId
exports.checkGroupStatus = async (username, noteGroupId) => {
    const { rows } = await db.query(`SELECT username, validated, admin FROM note_group_junction WHERE username = $1 AND note_group = $2`, [username, noteGroupId])
    if(!rows.length || !rows[0].validated) return Promise.reject({ status: 400, message: "Error Handling Request" })
}