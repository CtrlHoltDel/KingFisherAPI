const db = require("../db/connection")

exports.fetchPlayers = async (groupId, username) => {

    try {
        const { rows: groupCheck } = await db.query(`SELECT username, admin, validated, blocked FROM note_group_junction WHERE note_group = $1 AND username = $2`, [groupId, username])

        if(!groupCheck.length) return Promise.reject({ status: 400, message: "Cannot Process Request" })

        if(groupCheck[0].blocked) return Promise.reject({ status: 400, message: "Cannot Process Request" })
        if(!groupCheck[0].validated) return Promise.reject({ status: 400, message: "Pending Request" })

        const { rows: players } = await db.query(`SELECT name, type, created_time FROM players WHERE note_group_id = $1`, [groupId]);

        return players
    } catch (err) {
        console.log(err)
    }




    return { test: "test" }
}