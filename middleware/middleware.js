const jwt = require("jsonwebtoken");
const db = require("../db/connection");
const { restrictedError } = require("../utils/responses");
const openPaths = ["/auth/login", "/auth/register", "/ping"];

exports.validateToken = (req, res, next) => {
  if (openPaths.includes(req.path)) return next();

  const bearerHeader = req.headers["authorization"];

  if (!bearerHeader) return next({ status: 403, message: "Restricted" });

  try {
    const user = jwt.verify(bearerHeader.split(" ")[1], process.env.JWT_SECRET);
    
    req.user = user;
    next();
  } catch (error) {
    next({ status: 403, message: "Restricted" });
  }
};

// Only can access endpoints if part of the group
exports.groupValidation = async (req, res, next) => {
  const { username } = req.user;
  let { group_id, player_id, note_id } = req.params;

  // If there is a group id
  if (group_id) {
    try {
      const groupValidationCheck = await checkJunctionTable(username, group_id);
      if (
        !groupValidationCheck ||
        !groupValidationCheck.length ||
        !groupValidationCheck[0].validated
      ) {
        res.status(400).send(restrictedError);
        return;
      }
    } catch (error) {
      next({ status: 400, message: "Error Handling Request" });
    }
  }

  // If there is no group id and a player id
  if (!group_id && player_id) {
    try {
      const { rows: getGroupIdFromPlayer } = await db.query(
        `SELECT validated, players.note_group_id FROM note_group_junction ngj JOIN players ON players.note_group_id = ngj.note_group WHERE ngj.username = $1 AND players.id = $2`,
        [username, player_id]
      );

      if (
        !getGroupIdFromPlayer ||
        !getGroupIdFromPlayer.length ||
        !getGroupIdFromPlayer[0].validated
      ) {
        res.status(400).send(restrictedError);
        return;
      }
    } catch (error) {
      next({ status: 400, message: "Error Handling Request" });
    }
  }

  //If only note id is available
  if (note_id) {
    try {
      const { rows: validateFromNoteId } = await db.query(
        `SELECT
            note,
            notes.id note_id,
            ngj.id note_group_id,
            ngj.username,
            ngj.validated
          FROM
            notes
            JOIN players ON notes.player_id = players.id
            JOIN note_group_junction ngj ON players.note_group_id = ngj.note_group
           WHERE 
            username = $1 AND notes.id = $2`,
        [username, note_id]
      );

      if (
        !validateFromNoteId ||
        !validateFromNoteId.length ||
        !validateFromNoteId[0].validated
      ) {
        res.status(400).send(restrictedError);
        return;
      }
    } catch (error) {
      next({ status: 400, message: "Error Handling Request" });
    }
  }

  if (!group_id && !player_id && !note_id) {
    next({ status: 400, message: "Bad news - Malformed request" });
  }

  next();
};

// Only can access if an admin of the group
exports.groupValidationAdmin = async (req, res, next) => {
  const { username } = req.user;
  const { group_id } = req.params;

  try {
    const adminValidation = await checkJunctionTable(username, group_id);
    if (
      !adminValidation ||
      !adminValidation.length ||
      !adminValidation[0].validated ||
      !adminValidation[0].admin
    ) {
      res.status(400).send(restrictedError);
      return;
    }
  } catch (error) {
    next({ status: 400, message: "Error Handling Request" });
  }
  next();
};

// Only can access if owner of the group
exports.validationSysAdmin = async (req, res, next) => {
  const { username } = req.user;

  const { rows: user } = await db.query(
    `SELECT sysadmin FROM users WHERE username = $1`,
    [username]
  );

  if (!user[0].sysadmin) return res.status(400).send(restrictedError);

  next();
};

const checkJunctionTable = async (username, groupId) => {
  const { rows } = await db.query(
    `SELECT username, validated, admin FROM note_group_junction WHERE username = $1 AND note_group = $2`,
    [username, groupId]
  );
  return rows;
};
