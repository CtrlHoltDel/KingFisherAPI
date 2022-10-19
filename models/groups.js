const db = require("../db/connection");
const generateUUID = require("../utils/UUID");

exports.fetchGroups = async (username) => {
  const { rows } = await db.query(
    `SELECT
        ngj.note_group,
        ngj.username,
        ngj.id,
        ngj.validated,
        ng.name
    FROM
        "note_group_junction" ngj
        JOIN "note_group" ng ON ng.id = ngj.note_group
    WHERE
        ngj.username = $1
        AND ngj.validated = $2`,
    [username, true]
  );

  return rows;
};

exports.insertGroup = async (username, name) => {
  if (!name || name.length <= 3)
    return Promise.reject({
      status: 401,
      message: "Group name must be longer than 3 characters",
    });

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

exports.requestGroupJoin = async (groupName, username) => {
  try {
    const { rows: group } = await db.query(
      `SELECT name, id FROM note_group WHERE name = $1`,
      [groupName]
    );
    if (!group.length)
      return Promise.reject({ status: 400, message: "Group doesn't exist" });

    const { rows: groupJunctionCheck } = await db.query(
      `SELECT username, blocked, validated, admin, note_group FROM note_group_junction WHERE username = $1 AND note_group = $2`,
      [username, group[0].id]
    );

    if (groupJunctionCheck.length) {
      if (groupJunctionCheck[0].blocked)
        return Promise.reject({ status: 404, message: "Group doesn't exist" });
      if (groupJunctionCheck[0].validated)
        return Promise.reject({
          status: 200,
          message: "You already belong to this group",
        });

      return Promise.reject({
        status: 200,
        message: "You have a pending request",
      });
    }

    const { rows: joinedGroup } = await db.query(
      `INSERT INTO note_group_junction (username, note_group, id) VALUES ($1, $2, $3)`,
      [username, group[0].id, generateUUID()]
    );

    return { message: "Request submitted", groupName };
  } catch (error) {


    
  }
};

exports.checkGroupRequests = async (username) => {
  const { rows } = await db.query(`SELECT
                                     ng.name group_name, ngj.id group_id, ngj.username user_with_request, ngj.validated 
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

exports.acceptGroupRequest = async () => {
  
}
