const db = require("../connection");
const format = require("pg-format");
const bcrypt = require("bcryptjs");

const insertData = async ({
  users,
  notes,
  players,
  note_group,
  note_group_junction,
}) => {
  const usersQuery = format(
    `INSERT INTO users(id, username, password, created_time) VALUES %L`,
    users.map(({ id, username, password, created_time }) => [
      id,
      username,
      password,
      created_time,
    ])
  );

  const noteGroupQuery = format(
    `INSERT INTO note_group(id, name, created_time, created_by) VALUES %L`,
    note_group.map(({ id, name, created_time, created_by }) => [
      id,
      name,
      created_time,
      created_by,
    ])
  );

  const playersQuery = format(
    `INSERT INTO players(id, name, type, created_time, created_by, note_group_id) VALUES %L`,
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
    `INSERT INTO notes(id, created_by, created_time, note, player_id, type) VALUES %L`,
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
    `INSERT INTO note_group_junction (username, note_group) VALUES %L`,
    note_group_junction.map(({ username, note_group }) => [
      username,
      note_group,
    ])
  );

  await db.query(usersQuery);
  console.log("Table DATA inserted users")
  await db.query(noteGroupQuery);
  console.log("Table DATA inserted note group")
  await db.query(playersQuery);
  console.log("Table DATA inserted players")
  await db.query(notesQuery);
  console.log("Table DATA inserted notes")
  await db.query(groupJunctionQuery);
  console.log("Table DATA inserted note group junction")
};

module.exports = insertData;
