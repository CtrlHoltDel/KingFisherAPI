const db = require("../db/connection")

exports.checkGroupOwnership = async (username, groupId) => {
    const { rows } = await db.query(`SELECT name FROM note_group WHERE note_group.created_by = $1 AND id = $2`, [username, groupId])
    if(rows.length) return

    return Promise.reject({ status: 400, message: "Error handling request" })
}

exports.checkGroupStatus = async (username, noteGroupId) => {
    const { rows } = await db.query(`SELECT username, validated, admin FROM note_group_junction WHERE username = $1 AND note_group = $2`, [username, noteGroupId])
}