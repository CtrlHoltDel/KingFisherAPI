const db = require("../db/connection");
const generateUUID = require("../utils/UUID");

exports.fetchPlayers = async (groupId, username, limit, search) => {
  if(!limit) limit = 10
  if(!Number(limit)) return Promise.reject({ status: 400, message: "Cannot Process Request" })

  let { rows: players } = await db.query(
    `SELECT * FROM players WHERE note_group_id = $1 AND name ILIKE $2 LIMIT $3`,
    [groupId, search ? `%${search}%` : '%%', limit || 10]
  );

  // Formatting and looking for exact match
  if(search){
    const exactMatchFoundInInitialSearch = players.find(player => player.name === search)
    if(exactMatchFoundInInitialSearch){
      if(players[0].name !== search){
        players = [{ ...exactMatchFoundInInitialSearch, exactMatch: true }, ...players.filter((({ name }) => name !== search))]
      } else {
        players[0].exactMatch = true
      }
    } else {
      const { rows: foundExtraneousExactMatch } = await db.query('SELECT * FROM players WHERE note_group_id = $1 AND name = $2', [groupId, search])
      if(foundExtraneousExactMatch.length !== 0) {
        players = [{ ...foundExtraneousExactMatch[0], exactMatch: true }, ...players.slice((limit ? limit : 10) - 1)]
      }
    }
  }



  return players;
};

exports.fetchPlayer = async (groupId, username, searchedPlayerId) => {

  // TODO: Move to middleware
  // await checkGroupStatus(username, groupId)

  const { rows } = await db.query(`
    SELECT
          players.name,
          notes.note,
          notes.type,
          notes.created_time,
          notes.created_by
    FROM
      players
    JOIN 
      notes ON notes.player_id = players.id
    WHERE
      players.id = $1`,
    [searchedPlayerId]
  );

  let playerName;
  if(!rows.length){
    const { rows: foundUsername } = await db.query(`SELECT name FROM players WHERE id = $1`, [searchedPlayerId])
    playerName = foundUsername[0].name
  } else {
    playerName = rows[0].name
  }

  return { playerName, notes: rows }
};

exports.addPlayer = async (username, noteGroupId, newPlayerName) => {
  if(!newPlayerName) return Promise.reject({ status: 400, message: "Name cannot be a null value" })
  
  const { rows: newPlayer } = await db.query(
    `INSERT INTO players(id, name, created_by, note_group_id) VALUES($1, $2, $3, $4) RETURNING name, created_time, created_by, id`,
    [generateUUID(), newPlayerName, username, noteGroupId]
  );

  return newPlayer[0];
};

exports.amendPlayer = async (username, group_id, player_id, body) => {
  const { type } = body
  const { rows } = await db.query(`UPDATE players SET type = $1 WHERE note_group_id = $2 AND id = $3 RETURNING *`, [type, group_id, player_id])

  if(!rows.length) return Promise.reject({ status: 400, message: "Player doesn't exist" })

  return rows[0]
}