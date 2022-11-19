const db = require("../db/connection");
const generateUUID = require("./UUID");

// Types
const NOTE_GROUP = "group";
const PLAYER = "player";
const AUTH = "auth";
const NOTE_TYPE = 'note'

//Action
const CREATE = "create";
const ARCHIVE = "archive";
const UPDATE = "update";
const ADD = "add";

// Auth
exports.trackRegister = async (user) => {
  const { username } = user[0];
  await db.query(
    `INSERT INTO history(id, type, username, action, detail) VALUES($1, $2, $3, $4, $5)`,
    [generateUUID(), AUTH, username, CREATE, `${username} registered`]
  );
};

// Notes
exports.trackArchiveNote = async (
  noteId,
  userWhoArchived,
  type,
  note,
  relatedPlayer
) => {
  await db.query(
    `INSERT INTO history(id, type, username, player_id, note, action, detail, note_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      generateUUID(),
      NOTE_TYPE,
      userWhoArchived,
      relatedPlayer,
      note,
      ARCHIVE,
      `${userWhoArchived} deleted ${type} ${note} from player ${relatedPlayer}`,
      noteId,
    ]
  );
};

exports.trackAddNote = async (type, username, playerId, note, noteId) => {
  await db.query(
    `INSERT INTO history(id, type, username, player_id, note, detail, action, note_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      generateUUID(),
      NOTE_TYPE,
      username,
      playerId,
      note,
      `${username} added ${type} ${note}`,
      ADD,
      noteId,
    ]
  );
};

// GROUPS
exports.trackNewGroup = async (groupId, username) => {
  await db.query(
    `INSERT INTO history(id, type, username, note_group, action, detail) VALUES($1, $2, $3, $4, $5, $6)`,
    [
      generateUUID(),
      NOTE_GROUP,
      username,
      groupId,
      CREATE,
      `${username} created note group ${groupId}`,
    ]
  );
};

exports.trackAddedUserToGroup = async (groupId, username, addedUser) => {
  await db.query(
    `INSERT INTO history(id, type, username, note_group, action, detail) VALUES($1, $2, $3, $4, $5, $6)`,
    [
      generateUUID(),
      NOTE_GROUP,
      username,
      groupId,
      ADD,
      `${addedUser} added to group`,
    ]
  );
};

// PLAYERS
exports.trackAddNewPlayer = async (
  username,
  noteGroupId,
  newPlayerId,
  newPlayerName
) => {
  await db.query(
    `INSERT INTO history (id, type, username, note_group, action, player_id, detail) VALUES($1, $2, $3, $4, $5, $6, $7)`,
    [
      generateUUID(),
      PLAYER,
      username,
      noteGroupId,
      CREATE,
      newPlayerId,
      `${username} added ${newPlayerName} to group ${noteGroupId}`,
    ]
  );
};

exports.trackChangePlayerType = async (username, playerId, newType) => {
  await db.query(
    `INSERT INTO history (id, type, username, action, player_id, detail) VALUES($1, $2, $3, $4, $5, $6)`,
    [
      generateUUID(),
      PLAYER,
      username,
      UPDATE,
      playerId,
      `${username} updated ${playerId} to type ${newType}`,
    ]
  );
};
