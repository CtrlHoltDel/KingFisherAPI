const db = require("../connection");
const format = require("pg-format");
const { USERS_TABLE, NOTE_GROUP_TABLE, PLAYERS_TABLE, NOTES_TABLE, NOTE_GROUP_JUNCTION_TABLE } = require("../../utils/constants");

const insertData = async ({
  users,
  notes,
  players,
  note_group,
  note_group_junction,
}) => {
  const usersQuery = format(
    `INSERT INTO ${USERS_TABLE}(id, username, password, created_time, sysAdmin) VALUES %L`,
    users.map(({ id, username, password, created_time, sysAdmin }) => [
      id,
      username,
      password,
      created_time,
      sysAdmin || false
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
    `INSERT INTO ${NOTES_TABLE}(id, created_by, created_time, note, player_id, type) VALUES %L`,
    notes.map(({ id, created_by, created_time, note, player_id, type }) => [
      id,
      created_by,
      created_time,
      note,
      player_id,
      type,
    ])
  );

  const groupJunctionQuery = format(
    `INSERT INTO ${NOTE_GROUP_JUNCTION_TABLE} (id, username, note_group, validated, admin , created_time) VALUES %L`,
    note_group_junction.map(
      ({ id, username, note_group, validated, admin ,created_time }) => [
        id,
        username,
        note_group,
        validated,
        admin, created_time
      ]
    )
  );

  await db.query(usersQuery);
  await db.query(noteGroupQuery);
  await db.query(playersQuery);
  await db.query(notesQuery);
  await db.query(groupJunctionQuery);
};

module.exports = insertData;
