const format = require("pg-format");
const db = require("../db/connection");
const { HISTORY_TABLE } = require("../utils/constants");

const USERS_TABLE = 'users'

exports.fetchAdminUsers = async () => {
    const users = await getFullList(USERS_TABLE);
    return users
}

exports.fetchHistory = async () => {
    const { rows: history } = await db.query(`SELECT * FROM history`)
    return history
}

const getCount = async (tableName) => {
    const { rows } = await db.query(format(`SELECT COUNT(*) FROM %I`, tableName))
    return rows
}

const getFullList = async (tableName) => {
    const { rows } = await db.query(format(`SELECT * FROM %I`, tableName))
    return rows
}