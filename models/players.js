const db = require("../db/connection")
const { checkGroupStatus } = require("../utils/dbUtils")
const generateUUID = require("../utils/UUID")

exports.fetchPlayers = async (groupId, username) => {
    const { rows: groupCheck } = await db.query(`SELECT username, admin, validated, blocked FROM note_group_junction WHERE note_group = $1 AND username = $2`, [groupId, username])

    if(!groupCheck.length) return Promise.reject({ status: 400, message: "Cannot Process Request" })
    if(groupCheck[0].blocked) return Promise.reject({ status: 400, message: "Cannot Process Request" })
    if(!groupCheck[0].validated) return Promise.reject({ status: 400, message: "Pending Request" })

    const { rows: players } = await db.query(`SELECT name, type, created_time FROM players WHERE note_group_id = $1`, [groupId]);

    return players
}

exports.addPlayer = async (username, noteGroupId, newPlayerName) => {
  await checkGroupStatus(newPlayerName, username, noteGroupId)

  const { rows: newPlayer } = await db.query(`INSERT INTO players(id, name, created_by, note_group_id) VALUES($1, $2, $3, $4) RETURNING name, created_time, created_by`, [generateUUID(), newPlayerName, username, noteGroupId])

    return newPlayer

}