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
        created_by VARCHAR(255) REFERENCES users(username),
        note_group_id INTEGER REFERENCES note_group(id),
        UNIQUE (note_group_id, name)
    );`;

  const noteGroup = `CREATE TABLE note_group (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        created_time TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR REFERENCES users(username)
    );`;

  const notes = `CREATE TABLE notes(
        id SERIAL PRIMARY KEY,
        created_by VARCHAR(255) REFERENCES users(username),
        created_time TIMESTAMP DEFAULT NOW(),
        note VARCHAR,
        player_id INTEGER REFERENCES players(id), 
        type VARCHAR
    );`;

  const noteGroupJunction = `CREATE TABLE note_group_junction (
        id SERIAL PRIMARY KEY,
        username VARCHAR REFERENCES users(username),
        note_group INTEGER NOT NULL REFERENCES note_group(id),
        admin BOOLEAN DEFAULT FALSE,
        validated BOOLEAN DEFAULT FALSE
    );`;

  await db.query(users);
  console.log(`Table Created users`)
  await db.query(noteGroup);
  console.log(`Table Created note_group`)
  await db.query(players);
  console.log(`Table Created players`)
  await db.query(notes);
  console.log(`Table Created notes`)
  await db.query(noteGroupJunction);
  console.log(`Table Created note_group_junction`)
};

const dropTables = async () => {
  for (let i = 0; i < TABLES_NAMES.length; i++) {
    await db.query(`DROP TABLE IF EXISTS ${TABLES_NAMES[i]} CASCADE`);
    console.log(`Table ${TABLES_NAMES[i]} dropped`);
  }
};

module.exports = { dropTables, createTables };
