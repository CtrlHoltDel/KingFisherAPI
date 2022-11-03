const generateUUID = require("../../utils/UUID");
const db = require("../connection");

const insert = async () => {

    const { TYPE, PLAYER_ID, NOTE_AMOUNT = 50, NOTE_PREFIX = 'note' } = process.env;

    if(TYPE === 'note'){        
        for (let i = 0; i < NOTE_AMOUNT; i++) {
            await db.query(`INSERT INTO notes(id, created_by, note, player_id, type) VALUES ($1, $2, $3, $4, $5)`, [generateUUID(), 'ctrlholtdel', `${NOTE_PREFIX} ${i}`, PLAYER_ID, 'note'])
        }
    
        for (let i = 0; i < NOTE_AMOUNT; i++) {
            await db.query(`INSERT INTO notes(id, created_by, note, player_id, type) VALUES ($1, $2, $3, $4, $5)`, [generateUUID(), 'ctrlholtdel', `${NOTE_PREFIX} ${i}`, '1', 'tendency'])
        }
    }
}



insert()