const format = require("pg-format");
const db = require("../db/connection");
const { TABLES_NAMES } = require("../utils/constants");
const USERS_TABLE = 'users'
const { writeFile } = require("fs/promises");

exports.fetchAdminUsers = async () => {
    const users = await getFullList(USERS_TABLE);
    return users
}

exports.fetchHistory = async () => {
    const { rows: history } = await db.query(`SELECT * FROM history`)
    return history
}

exports.generateBackup = async () => {
    const backup = {}

    for (let i = 0; i < TABLES_NAMES.length; i++) {
        const tableName = TABLES_NAMES[i]
        const fullTable = await getFullList(tableName)
        backup[tableName] = fullTable;
    }

    await writeFile(
        `${__dirname.slice(0, -7)}/backup/backup.json`,
        JSON.stringify(backup)
    );
}

const getCount = async (tableName) => {
    const { rows } = await db.query(format(`SELECT COUNT(*) FROM %I`, tableName))
    return rows
}

const getFullList = async (tableName) => {
    const { rows } = await db.query(format(`SELECT * FROM %I`, tableName))
    return rows
}