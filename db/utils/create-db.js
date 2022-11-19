const { TABLES_NAMES, USERS_TABLE, PLAYERS_TABLE, NOTE_GROUP_TABLE, NOTES_TABLE, NOTE_GROUP_JUNCTION_TABLE, HISTORY_TABLE } = require("../../utils/constants");
const db = require("../connection");

const createTables = async () => {
  const users = `CREATE TABLE ${USERS_TABLE}(
      id VARCHAR PRIMARY KEY,
      username VARCHAR NOT NULL UNIQUE, 
      password VARCHAR NOT NULL,
      created_time TIMESTAMP DEFAULT NOW(),
      sysAdmin BOOLEAN DEFAULT FALSE
  )`;

  const players = `CREATE TABLE ${PLAYERS_TABLE} (
        id VARCHAR PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR,
        created_time TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255) REFERENCES users(username),
        note_group_id VARCHAR REFERENCES note_group(id),
        UNIQUE (note_group_id, name)
  );`;

  const noteGroup = `CREATE TABLE ${NOTE_GROUP_TABLE} (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        created_time TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR REFERENCES users(username)
    );`;

  const notes = `CREATE TABLE ${NOTES_TABLE}(
        id VARCHAR PRIMARY KEY,
        created_by VARCHAR(255) REFERENCES users(username),
        created_time TIMESTAMP DEFAULT NOW(),
        note VARCHAR,
        player_id VARCHAR REFERENCES players(id), 
        type VARCHAR,
        archived BOOLEAN DEFAULT FALSE
  );`;

  const noteGroupJunction = `CREATE TABLE ${NOTE_GROUP_JUNCTION_TABLE} (
        id VARCHAR PRIMARY KEY,
        username VARCHAR REFERENCES users(username) NOT NULL,
        note_group VARCHAR NOT NULL REFERENCES note_group(id),
        admin BOOLEAN DEFAULT FALSE,
        validated BOOLEAN DEFAULT FALSE,
        blocked BOOLEAN DEFAULT FALSE,
        created_time TIMESTAMP DEFAULT NOW(), 
        UNIQUE(note_group, username)
  );`;

  const history = `CREATE TABLE ${HISTORY_TABLE} (
    id VARCHAR PRIMARY KEY,
    type VARCHAR,
    action VARCHAR,
    username VARCHAR REFERENCES users(username),
    note_group VARCHAR REFERENCES note_group(id),
    note VARCHAR,
    time_stamp TIMESTAMP DEFAULT NOW(),
    detail VARCHAR,
    player_id VARCHAR,
    note_id VARCHAR
  );`;

  await db.query(users);
  await db.query(noteGroup);
  await db.query(players);
  await db.query(notes);
  await db.query(noteGroupJunction);
  await db.query(history);
};

const dropTables = async () => {
  for (let i = 0; i < TABLES_NAMES.length; i++) {
    await db.query(`DROP TABLE IF EXISTS ${TABLES_NAMES[i]} CASCADE`);
  }
};

module.exports = { dropTables, createTables };
