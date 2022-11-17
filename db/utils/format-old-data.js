const fs = require("fs/promises");
const generateUUID = require("../../utils/UUID");

const DEFAULT_USERNAME = 'ctrlholtdel'

const formatData = async () => {
  const data = await fs.readFile(
    `${__dirname.slice(0, 46)}/data/old-data.json`
  );

  const parsedData = JSON.parse(data);
  const { users, notes, tendencies, players } = parsedData;

  const noteGroupId = generateUUID();

  const formattedData = {
    users: [],
    note_group: [
      {
        id: noteGroupId,
        name: "kingfisher",
        created_time: "2022-01-18T10:35:15.903Z",
        created_by: "ctrlholtdel",
      },
    ],
    note_group_junction: [],
    players: [],
    notes: [],
  };

  const userMap = {};
  users.forEach(({ username, password, u_created_at, admin, validated, sysAdmin }) => {
    if(formattedData.users.some(user => user.username === username.toLowerCase())) return

    const userId = generateUUID();
    userMap[username] = userId;
    formattedData.users.push({
      id: userId,
      username: username.toLowerCase(),
      password,
      created_time: u_created_at,
      sysAdmin: sysAdmin || username.toLowerCase() === DEFAULT_USERNAME || false
    });

    formattedData.note_group_junction.push( {
        id: generateUUID(),
        username: username.toLowerCase(),
        validated,
        admin, 
        created_time: u_created_at,
        note_group: noteGroupId 
    })
  });

  const playersMap = {}
  players.forEach(({ player_name, type, p_created_at, p_created_by }) => {
    const playerUUID = generateUUID();

    playersMap[player_name] = playerUUID
    formattedData.players.push({
        id: playerUUID,
        name: player_name, 
        type: type,
        created_time: p_created_at,
        created_by: p_created_by === 'admin' ? DEFAULT_USERNAME : p_created_by ? p_created_by.toLowerCase() : DEFAULT_USERNAME,
        note_group_id: noteGroupId
    });
  });
  
  const usernames = []
  notes.forEach(({ player_name, n_created_at, note, n_created_by }) => {

    formattedData.notes.push({ 
        id: generateUUID(),
        created_by: (n_created_by === 'unknown' || n_created_by === 'Unknown' || n_created_by === 'admin') ? DEFAULT_USERNAME : n_created_by.toLowerCase() || DEFAULT_USERNAME,
        created_time: n_created_at,
        note,
        type: 'note',
        player_id: playersMap[player_name]
    })

})

tendencies.forEach(({ player_name, tendency, t_created_at, t_created_by }) => {
    formattedData.notes.push({ 
        id: generateUUID(),
        created_by: t_created_by ? t_created_by.toLowerCase() : DEFAULT_USERNAME, 
        created_time: t_created_at,
        note: tendency,
        type: 'tendency',
        player_id: playersMap[player_name]
    })
})

  await fs.writeFile(`${__dirname.slice(0, -9)}/db/data/formatted-data.json`, JSON.stringify(formattedData))
};

formatData();


/*

    {
      "note_id": 35,
      "player_name": "abhinav",
      "n_created_at": "2022-01-18T10:35:15.903Z",
      "note": "utgvmp AA raise calls 3b check raises 842hhx",
      "n_created_by": "unknown"
    },

    {
      "id": "1",
      "created_by": "ctrlholtdel",
      "created_time": "2022-01-18T10:35:15.903Z",
      "note": "note-contents 1",
      "player_id": "1",
      "type": "note"
    },

*/