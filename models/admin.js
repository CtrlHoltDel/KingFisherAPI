const format = require("pg-format");
const db = require("../db/connection");
const { writeFile } = require("fs/promises");

const { TABLES_NAMES, HISTORY_TABLE } = require("../utils/constants");

exports.fetchAdminUsers = async () => {
    const { rows } = await db.query(`SELECT
                                        username,
                                        created_time,
                                        sysadmin,
                                        (
                                          SELECT
                                            COUNT(id)
                                          FROM
                                            players
                                          WHERE
                                            created_by = users.username
                                        ) AS added_player_count,
                                        (
                                          SELECT
                                            COUNT(id)
                                          FROM
                                            notes
                                          WHERE
                                            created_by = users.username
                                        ) AS added_notes_count
                                      FROM
                                        users
                                      ORDER BY added_notes_count DESC
                                      `
                                 )
    return rows
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

    if(offset > 0) offset = limit * (offset - 1);

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

exports.updateUser = async (username) => {
    const { rows } = await db.query(`UPDATE users SET sysAdmin = $1 WHERE username = $2 RETURNING *`, [true, username]);

    if(!rows.length) return Promise.reject({ status: 400, message: "User doesn't exist" });

    return { message: `${username} set to sysadmin`, id: rows[0].id }
}

exports.fetchGroupsAdmin = async () => {
    const { rows } = await db.query(`SELECT ng.*, (SELECT COUNT(*) FROM note_group_junction ngj WHERE ngj.note_group = ng.id) as user_count FROM note_group ng`);
    return rows
}

exports.fetchSingleGroupAdmin = async (groupId) => {
    const { rows: group } = await db.query(`SELECT * FROM note_group WHERE id = $1`, [groupId])
    const { rows: users } = await db.query(`SELECT * FROM note_group_junction WHERE note_group = $1`, [groupId]);
    const { rows: noteCount } = await db.query(`SELECT COUNT(*) FROM players WHERE note_group_id = $1`, [groupId]); 

    return { ...group[0], noteCount: noteCount[0].count, users }
}

exports.fetchAdminNotes = async (archived, username) => {
  if(archived){
    let notes;

    if(username) {
      const { rows: notesResponse } = await db.query(`SELECT h.time_stamp archive_date, n.created_time created_time, n.note, h.username archived_by, n.created_by FROM history AS h JOIN notes AS n ON note_id = n.id WHERE h.action = 'archive' AND h.username = $1 ORDER BY archive_date DESC`, [username])
      notes = notesResponse
    } else {
      const { rows: notesResponse } = notes = await db.query(`SELECT h.time_stamp archive_date, n.created_time created_time, n.note, h.username archived_by, n.created_by FROM history AS h JOIN notes AS n ON note_id = n.id WHERE h.action = 'archive' ORDER BY archive_date DESC`)
      notes = notesResponse
    }

    return notes
  }

}

const getCount = async (tableName) => {
    const { rows } = await db.query(format(`SELECT COUNT(*) FROM %I`, tableName))
    return rows
}

const getFullList = async (tableName) => {
    const { rows } = await db.query(format(`SELECT * FROM %I`, tableName))
    return rows
}