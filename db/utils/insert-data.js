const db = require("../connection");
const format = require("pg-format");
const {
  USERS_TABLE,
  NOTE_GROUP_TABLE,
  PLAYERS_TABLE,
  NOTES_TABLE,
  NOTE_GROUP_JUNCTION_TABLE,
  HISTORY_TABLE,
} = require("../../utils/constants");

const insertData = async ({
  users,
  notes,
  players,
  note_group,
  note_group_junction,
  history
}) => {
  const usersQuery = format(
    `INSERT INTO ${USERS_TABLE}(id, username, password, created_time, sysAdmin) VALUES %L`,
    users.map(({ id, username, password, created_time, sysadmin }) => [
      id,
      username,
      password,
      created_time,
      sysadmin,
    ])
  );

  const noteGroupQuery = format(
    `INSERT INTO ${NOTE_GROUP_TABLE}(id, name, created_time, created_by) VALUES %L`,
    note_group.map(({ id, name, created_time, created_by }) => [
      id,
      name,
      created_time,
      created_by,
    ])
  );

  const playersQuery = format(
    `INSERT INTO ${PLAYERS_TABLE}(id, name, type, created_time, created_by, note_group_id) VALUES %L`,
    players.map(
      ({ id, name, type, created_time, created_by, note_group_id }) => [
        id,
        name,
        type,
        created_time,
        created_by,
        note_group_id,
      ]
    )
  );

  const notesQuery = format(
    `INSERT INTO ${NOTES_TABLE}(id, created_by, created_time, note, player_id, type, archived) VALUES %L`,
    notes.map(({ id, created_by, created_time, note, player_id, type, archived }) => [
      id,
      created_by,
      created_time,
      note,
      player_id,
      type,
      archived || false
    ])
  );

  const groupJunctionQuery = format(
    `INSERT INTO ${NOTE_GROUP_JUNCTION_TABLE} (id, username, note_group, validated, admin , created_time) VALUES %L`,
    note_group_junction.map(
      ({ id, username, note_group, validated, admin, created_time }) => [
        id,
        username,
        note_group,
        validated,
        admin,
        created_time,
      ]
    )
  );

  const historyQuery = format(
    `INSERT INTO ${HISTORY_TABLE}(id,
        type,
        action,
        username,
        note_group,
        note,
        time_stamp,
        detail,
        player_id,
        note_id) VALUES %L`,
    history.map(
      ({
        id,
        type,
        action,
        username,
        note_group,
        note,
        time_stamp,
        detail,
        player_id,
        note_id,
      }) => [
        id,
        type,
        action,
        username,
        note_group,
        note,
        time_stamp,
        detail,
        player_id,
        note_id,
      ]
    )
  );

  await db.query(usersQuery);
  await db.query(noteGroupQuery);
  await db.query(playersQuery);
  await db.query(notesQuery);
  await db.query(groupJunctionQuery);
  if(history.length) await db.query(historyQuery);
};

module.exports = insertData;
