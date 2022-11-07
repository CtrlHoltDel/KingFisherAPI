const db = require("../db/connection");
const generateUUID = require("../utils/UUID");

const NOTE_TYPE = 'note'
const TENDENCY_TYPE = 'tendency'

exports.fetchPlayers = async (groupId, limit, search) => {
  if(!limit) limit = 10
  if(!Number(limit)) return Promise.reject({ status: 400, message: "Cannot Process Request" })

  const decodedSearch = decodeURIComponent(search)

  let { rows: players } = await db.query(
    `SELECT * FROM players WHERE note_group_id = $1 AND name ILIKE $2 LIMIT $3`,
    [groupId, decodedSearch ? `%${decodedSearch}%` : '%%', limit || 10]
  );

  console.log(players, "<< before")

  // Formatting and looking for exact match
  if(decodedSearch){
    const exactMatchFoundInInitialSearch = players.find(player => player.name === decodedSearch)
    if(exactMatchFoundInInitialSearch){
      if(players[0].name !== decodedSearch){
        players = [{ ...exactMatchFoundInInitialSearch, exactMatch: true }, ...players.filter((({ name }) => name !== decodedSearch))]
      } else {
        players[0].exactMatch = true
      }
    } else {
      const { rows: foundExtraneousExactMatch } = await db.query('SELECT * FROM players WHERE note_group_id = $1 AND name = $2', [groupId, decodedSearch])
      if(foundExtraneousExactMatch.length !== 0) {
        players = [{ ...foundExtraneousExactMatch[0], exactMatch: true }, ...players.slice((limit ? limit : 10) - 1)]
      }
    }
  }

  console.log(players, "<< after")



  return players;
};

exports.fetchPlayer = async (searchedPlayerId) => {

  const { rows } = await db.query(`
    SELECT
          players.name,
          notes.note,
          notes.type,
          notes.created_time,
          notes.created_by,
          players.id
    FROM
      players
    JOIN 
      notes ON notes.player_id = players.id
    WHERE
      (notes.type = $1 OR notes.type = $2)
    AND
      players.id = $3
    `,
    [NOTE_TYPE, TENDENCY_TYPE, searchedPlayerId]
  );


  let playerName;
  if(!rows.length){
    const { rows: foundUsername } = await db.query(`SELECT name FROM players WHERE id = $1`, [searchedPlayerId])
    playerName = foundUsername[0].name
  } else {
    playerName = rows[0].name
  }

  const notes = rows.filter(note => note.type === NOTE_TYPE)
  const tendencies = rows.filter(note => note.type === TENDENCY_TYPE)

  return { playerName, notes, tendencies }
};

exports.addPlayer = async (username, noteGroupId, newPlayerName) => {
  if(!newPlayerName) return Promise.reject({ status: 400, message: "Name cannot be a null value" })
  
  const { rows: newPlayer } = await db.query(
    `INSERT INTO players(id, name, created_by, note_group_id) VALUES($1, $2, $3, $4) LIMIT 1 RETURNING name, created_time, created_by, id`,
    [generateUUID(), newPlayerName, username, noteGroupId]
  );

  return { ...newPlayer[0], name: decodeURIComponent(newPlayer[0].name) };
};

exports.amendPlayer = async (username, group_id, player_id, body) => {
  const { type } = body
  const { rows } = await db.query(`UPDATE players SET type = $1 WHERE note_group_id = $2 AND id = $3 RETURNING *`, [type, group_id, player_id])

  if(!rows.length) return Promise.reject({ status: 400, message: "Player doesn't exist" })

  return rows[0]
}