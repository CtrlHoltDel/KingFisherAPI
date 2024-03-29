const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");
const { trackRegister } = require("../utils/historyTracking");
const generateUUID = require("../utils/UUID");

exports.handleLogin = async (username, password) => {
  if (!username || !password)
  return Promise.reject({
    status: 401,
    message: "Invalid Login Credentials",
  });

  username = username.toLowerCase()

    const { rows } = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);

    if (!rows.length) return Promise.reject({ status: 403, message: "invalid credentials" });

    const validPassword = await bcrypt.compare(`${password}`, rows[0].password);

    if (!validPassword) return Promise.reject({ status: 403, message: "invalid credentials" });

    const jwtBody = rows[0].sysadmin ? { username: rows[0].username, sysadmin: true } : { username: rows[0].username }

    const token = jwt.sign(
      jwtBody,
      process.env.JWT_SECRET
    );

    return { token, ...jwtBody };
};

exports.handleRegister = async (username, password) => {
  
  if (!username || !password)
  return Promise.reject({
    status: 403,
    message: "Invalid Register Credentials - No Null Values",
  });
  
  username = username.toLowerCase()

  if(/\s/.test(username)) return Promise.reject({
    status: 400,
    message: "Username cannot contain spaces",
  })

  if (username.length < 3)
    return Promise.reject({ status: 403, message: "Username Too Short" });
  if (password.length < 3)
    return Promise.reject({ status: 403, message: "Password Too Short" });

  const { rows: userSearch } = await db.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );

  if (!!userSearch.length)
    return Promise.reject({ status: 400, message: "Username taken" });

  const hashedPassword = await bcrypt.hash(`${password}`, 10);

  const { rows: addedUser } = await db.query(
    `INSERT INTO users (id, username, password) VALUES ($1, $2, $3) RETURNING username, created_time`,
    [generateUUID(), username, hashedPassword]
  );

  await trackRegister(addedUser)



  return addedUser[0];

};