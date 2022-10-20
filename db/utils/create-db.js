const db = require("../connection");

const TABLES_NAMES = ["users" ,"notes", "players", "note_group", "note_group_junction"];

const createTables = async () => {
  const users = `CREATE TABLE users(
      id VARCHAR PRIMARY KEY,
      username VARCHAR NOT NULL UNIQUE, 
      password VARCHAR NOT NULL,
      created_time TIMESTAMP DEFAULT NOW()
  )`;

  const players = `CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR,
        created_time TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255) REFERENCES users(username),
        note_group_id VARCHAR REFERENCES note_group(id),
        UNIQUE (note_group_id, name)
  );`;

  const noteGroup = `CREATE TABLE note_group (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        created_time TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR REFERENCES users(username)
    );`;

  const notes = `CREATE TABLE notes(
        id VARCHAR PRIMARY KEY,
        created_by VARCHAR(255) REFERENCES users(username),
        created_time TIMESTAMP DEFAULT NOW(),
        note VARCHAR,
        player_id INTEGER REFERENCES players(id), 
        type VARCHAR
  );`;

  const noteGroupJunction = `CREATE TABLE note_group_junction (
        id VARCHAR PRIMARY KEY,
        username VARCHAR REFERENCES users(username),
        note_group VARCHAR NOT NULL REFERENCES note_group(id),
        admin BOOLEAN DEFAULT FALSE,
        validated BOOLEAN DEFAULT FALSE,
        blocked BOOLEAN DEFAULT FALSE,
        created_time TIMESTAMP DEFAULT NOW(), 
        UNIQUE(note_group, username)
  );`;

  await db.query(users);
  await db.query(noteGroup);
  await db.query(players);
  await db.query(notes);
  await db.query(noteGroupJunction);
};

const dropTables = async () => {
  for (let i = 0; i < TABLES_NAMES.length; i++) {
    await db.query(`DROP TABLE IF EXISTS ${TABLES_NAMES[i]} CASCADE`);
  }
};

module.exports = { dropTables, createTables };
