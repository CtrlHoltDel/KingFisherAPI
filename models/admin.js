const db = require("../db/connection")

exports.fetchAdminGeneral = async () => {

    const users = await getFullList('users');

    console.log(users)
    
}

const getFullList = async (tableName) => {
    const { rows } = await db.query(`SELECT * FROM users`)
    console.log(rows)
}