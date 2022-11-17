const format = require("pg-format");
const db = require("../db/connection");
const { TABLES_NAMES } = require("../utils/constants");

const TABLES = []
const USERS_TABLE = 'users'

exports.fetchAdminUsers = async () => {
    const users = await getFullList(USERS_TABLE);
}

const getCount = async (tableName) => {
    const { rows } = await db.query(format(`SELECT COUNT(*) FROM %I`, tableName))
    return rows
}

const getFullList = async (tableName) => {
    const { rows } = await db.query(format(`SELECT * FROM %I`, tableName))
    return rows
}