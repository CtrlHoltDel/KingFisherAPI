const db = require("../db/connection");
const generateUUID = require("../utils/UUID");

exports.fetchGroups = async (username) => {

  // Update to return all groups you're a part of and pending requests
  const { rows } = await db.query(
    `SELECT
        ng.name,
        ng.id,
        ng.created_by,
        ngj.validated,
        ng.created_time
    FROM
        "note_group_junction" ngj
        JOIN "note_group" ng ON ng.id = ngj.note_group
    WHERE
        ngj.username = $1
    AND
        ngj.blocked = $2
      `,
    [username, false]
  );
  
  return rows;
};

exports.insertGroup = async (username, name) => {
  if (!name || name.length <= 3)
    return Promise.reject({
      status: 401,
      message: "Group name must be longer than 3 characters",
    });

    name = name.toLowerCase();

  try {
    // Checking if a group by that name already exists.
    const { rows: recordCheck } = await db.query(
      `SELECT name FROM note_group WHERE name = $1`,
      [name]
    );
    if (!!recordCheck.length)
      return Promise.reject({
        status: 400,
        message: "Group with that name already exists",
      });

    // If not, generate the group and the group junction table record.
    const groupId = generateUUID();
    const { rows } = await db.query(
      `INSERT INTO note_group (name, created_by, id) VALUES ($1, $2, $3) RETURNING name, created_time, id`,
      [name, username, groupId]
    );
    await db.query(
      `INSERT INTO note_group_junction(note_group, admin, validated, username, id) VALUES ($1, $2, $3, $4, $5)`,
      [groupId, true, true, username, generateUUID()]
    );

    return { name: rows[0].name, created_time: rows[0].created_time };
  } catch (err) {
    return Promise.reject({ status: 404, message: err });
  }
};

exports.requestGroupJoin = async (groupId, username) => {
  try {
    const { rows: group } = await db.query(
      `SELECT name, id FROM note_group WHERE id = $1`,
      [groupId]
    );

    if (!group.length)
      return Promise.reject({ status: 400, message: "Cannot Process Request" });

    const { rows: groupJunctionCheck } = await db.query(
      `SELECT username, blocked, validated, admin, note_group FROM note_group_junction WHERE username = $1 AND note_group = $2`,
      [username, groupId]
    );

    if (groupJunctionCheck.length) {
      if (groupJunctionCheck[0].blocked)
        return Promise.reject({ status: 404, message: "Cannot Process Request" });
      if (groupJunctionCheck[0].validated)
        return Promise.reject({
          status: 200,
          message: "You already belong to this group",
        });

      return Promise.reject({
        status: 422,
        message: "You have a pending request",
      });
    }

    await db.query(
      `INSERT INTO note_group_junction (username, note_group, id) VALUES ($1, $2, $3)`,
      [username, groupId, generateUUID()]
    );

    return { message: `Request submitted to group: ${groupId}` };

  } catch (error) {
    return Promise.reject({ status: 404, message: err });
  }
};

exports.checkGroupRequests = async (username) => {
  const { rows } = await db.query(`SELECT
                                     ng.name group_name, ngj.id group_id, ngj.username as user 
                                   FROM
                                     note_group ng
                                   JOIN
                                     note_group_junction ngj ON ng.id = ngj.note_group
                                   WHERE
                                     ng.created_by = $1 AND ngj.validated = false;`,
                                   [username]
                                 );

  return rows
};

exports.handleUserRequest = async (currentUsername, action, group_id, username) => {
  if(!username) return Promise.reject({ status: 400, message: "Cannot Process Request" })

  username = username.toLowerCase()

  if(action.toLowerCase() === 'add'){
    const { rows: alreadyExistsCheck } = await db.query(`SELECT username, note_group, validated, admin FROM note_group_junction WHERE note_group = $1 AND username = $2`, [group_id, username])

    if(alreadyExistsCheck.length){
      if(alreadyExistsCheck[0]?.validated || alreadyExistsCheck[0]?.admin) return `${username} already in group`
      await db.query(`UPDATE note_group_junction SET validated = $1 WHERE note_group = $2 AND username = $3 RETURNING note_group, username`, [true, group_id, username])
      return `${username} added`
    }    
    
    await db.query(`INSERT INTO note_group_junction (id, username, note_group, validated) VALUES ($1, $2, $3, $4)`, [generateUUID(), username, group_id, true]);
    return `${username} added`
  } 

  return Promise.reject({ status: 400, message: "Cannot Process Request" })
  
}