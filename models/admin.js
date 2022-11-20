const format = require("pg-format");
const db = require("../db/connection");
const { writeFile } = require("fs/promises");

const { TABLES_NAMES, HISTORY_TABLE } = require("../utils/constants");
const USERS_TABLE = 'users'


exports.fetchAdminUsers = async () => {
    const users = await getFullList(USERS_TABLE);
    return users
}

const promiseReject = () => Promise.reject({ status: 400, message: 'Cannot Process Request' })

const HISTORY_TYPES = ['note', 'tendency', 'auth', 'group', 'player']
const ACTION_TYPES = ['add', 'update', 'archive', 'create']
exports.fetchHistory = async (type, action, order = 'DESC', limit = 20, offset = 0) => {
    if(type && !HISTORY_TYPES.includes(type)) return promiseReject()
    if(action && !ACTION_TYPES.includes(action)) return promiseReject()
    if((order.toUpperCase() !== 'DESC' && order.toUpperCase() !== 'ASC')) return promiseReject()


    if(/\D/.test(limit) || /\D/.test(offset) || offset % 1 !== 0 || limit % 1 !== 0) return promiseReject()

    if(limit > 100) limit = 100

    const baseQuery = `SELECT * FROM history`
    const filterArray = []
    let filters = ''
    const orderby = ` ORDER BY time_stamp ${order}`

    if(type) filterArray.push(type)
    if(action) filterArray.push(action)

    // if there's just type
    if(type && !action) filters = ' WHERE type = $1'
    // if there's just action
    if(action && !type) filters = ' WHERE action = $1'
    // if theres action and type
    if(action && type) filters = ' WHERE type = $1 AND action = $2'

    const limitOffset = ` LIMIT ${limit} OFFSET ${offset}`

    const completeQuery = baseQuery + filters + orderby + limitOffset

    const { rows: history } = await db.query(completeQuery, filterArray)
    return history
}

exports.generateBackup = async () => {
    const backup = {}

    for (let i = 0; i < TABLES_NAMES.length; i++) {
        const tableName = TABLES_NAMES[i]
        if(tableName === HISTORY_TABLE) continue
        const fullTable = await getFullList(tableName)
        backup[tableName] = fullTable;
    }

    await writeFile(
        `${__dirname.slice(0, -7)}/backup/backup.json`,
        JSON.stringify(backup)
    );
}

exports.generateHistoryBackup = async () => {
    const history = await getFullList(HISTORY_TABLE);
    return history;
}

const getCount = async (tableName) => {
    const { rows } = await db.query(format(`SELECT COUNT(*) FROM %I`, tableName))
    return rows
}

const getFullList = async (tableName) => {
    const { rows } = await db.query(format(`SELECT * FROM %I`, tableName))
    return rows
}