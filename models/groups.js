const db = require("../db/connection");
const { trackNewGroup, trackAddedUserToGroup } = require("../utils/historyTracking");
const generateUUID = require("../utils/UUID");

exports.fetchGroups = async (username) => {

  // Update to return all groups you're a part of and pending requests
  const { rows: groups } = await db.query(
    `SELECT
        ng.name,
        ng.id,
        ng.created_by,
        ngj.validated,
        ng.created_time,
        ngj.admin
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

  // Getting all related users if the user is an admin of that group
  const adminGroupIds = groups.filter(group => group.admin).map(group => group.id)
  
  if(adminGroupIds.length){
    const searchString = adminGroupIds.reduce((curr, next, index) => curr + `note_group = $${index + 1}${index === adminGroupIds.length - 1 ? '' : ' OR '}`, '')
    const { rows: users } = await db.query(`SELECT username, admin, validated, blocked, note_group FROM note_group_junction WHERE ${searchString};`, adminGroupIds)
    const formattedGroups = groups.map(group => group.admin ? { ...group, users: users.filter(user => user.note_group === group.id )} : group )
    return formattedGroups
  }

  return groups.map(group => ({ ...group, users: [] }));
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

    await trackNewGroup(groupId, username)

    return { name: rows[0].name, created_time: rows[0].created_time, id: rows[0].id, created_by: username };
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

exports.handleUserRequest = async (action, group_id, username, currentUser) => {
  if(!username) return Promise.reject({ status: 400, message: "Cannot Process Request" })

  username = username.toLowerCase()

  if(action.toLowerCase() === 'add'){
    const { rows: alreadyExistsCheck } = await db.query(`SELECT username, note_group, validated, admin FROM note_group_junction WHERE note_group = $1 AND username = $2`, [group_id, username])

    if(alreadyExistsCheck.length){
      if(alreadyExistsCheck[0]?.validated || alreadyExistsCheck[0]?.admin) return `${username} already in group`
      await db.query(`UPDATE note_group_junction SET validated = $1 WHERE note_group = $2 AND username = $3`, [true, group_id, username])
      await trackAddedUserToGroup(group_id, currentUser, username)

      return { message: `${username} added` }
    }    
    
    await db.query(`INSERT INTO note_group_junction (id, username, note_group, validated) VALUES ($1, $2, $3, $4)`, [generateUUID(), username, group_id, true]);


    await trackAddedUserToGroup(group_id, currentUser, username)  
    return { message: `${username} added` }
  } 

  if(action.toLowerCase() === 'admin'){
    await db.query(`UPDATE note_group_junction SET admin = $1 WHERE note_group = $2 AND username = $3 returning note_group, username`, [true, group_id, username])
    return { message: `${username} updated to admin on group ${group_id}` }
  }

  if(action.toLowerCase() === 'remove'){
    await db.query(`DELETE FROM note_group_junction WHERE username = $1 AND note_group = $2`, [username, group_id])
    return { status: 202, message: `${username} removed from group ${group_id}`}
  }

  return Promise.reject({ status: 400, message: "Cannot Process Request" })
  
}