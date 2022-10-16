const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");
const EM = require("../utils/errorMessages");

exports.handleLogin = async (username, password) => {

    if(!username || !password) return Promise.reject({ status: 403, message: "Invalid Login Credentials" })

  const { rows } = await db.query(`SELECT * FROM users WHERE username = $1`, [
    username.toLowerCase(),
  ]);

  if (!rows.length)
    return Promise.reject(EM.invalidCredentials);

  const validPassword = await bcrypt.compare(`${password}`, rows[0].password);

  if (!validPassword)
    return Promise.reject(EM.invalidCredentials);

  const token = jwt.sign(
    { username: rows[0].username },
    process.env.JWT_SECRET
  );

  return { token, username: rows[0].username };
};

exports.handleRegister = async (username, password) => {
    if(!username || !password) return Promise.reject({ status: 403, message: "Invalid Register Credentials - No Null Values" })

    // TODO: Handle too short usernames

    const { rows: userSearch } = await db.query(`SELECT * FROM users WHERE username = $1`, [
        username.toLowerCase(),
    ]);

    if(!!userSearch.length) return Promise.reject({ status: 400, message: "User already exists" })

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows: addedUser } = await db.query(`INSERT INTO users (username, password) VALUES ($1, $2) RETURNING username, created_time`, [username, hashedPassword])

    return addedUser
}
