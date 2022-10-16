const db = require("../connection");

const TABLES_NAMES = ["users" ,"notes", "players", "note_group", "note_group_junction"];

const createTables = async () => {
  const users = `CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      username VARCHAR NOT NULL UNIQUE, 
      password VARCHAR NOT NULL,
      created_time TIMESTAMP DEFAULT NOW()
  )`;

  const players = `CREATE TABLE players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR,
        created_time TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255)
    );`;

  const noteGroup = `CREATE TABLE note_group (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        created TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255)
    );`;

  const notes = `CREATE TABLE notes(
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL REFERENCES players(id),
        created_at TIMESTAMP DEFAULT NOW(),
        note VARCHAR,
        created_by VARCHAR(255),
        note_group_id INTEGER NOT NULL REFERENCES note_group(id)
    );`;

  const noteGroupJunction = `CREATE TABLE note_group_junction (
        id SERIAL PRIMARY KEY,
        username VARCHAR REFERENCES users(username),
        note_group INTEGER NOT NULL REFERENCES note_group(id),
        admin BOOLEAN DEFAULT FALSE,
        validated BOOLEAN DEFAULT FALSE
    );`;

  await db.query(users);
  await db.query(players);
  await db.query(noteGroup);
  await db.query(noteGroupJunction);
  await db.query(notes);
  db.end();
};

const dropTables = async () => {
  for (let i = 0; i < TABLES_NAMES.length; i++) {
    await db.query(`DROP TABLE IF EXISTS ${TABLES_NAMES[i]} CASCADE`);
    console.log(`Table ${TABLES_NAMES[i]} dropped`);
  }
};

module.exports = { dropTables, createTables };
