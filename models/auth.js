const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");
const EM = require("../utils/errorMessages");
const generateUUID = require("../utils/UUID");

exports.handleLogin = async (username, password) => {
  username = username.toLowerCase()

  try {
    if (!username || !password)
      return Promise.reject({
        status: 403,
        message: "Invalid Login Credentials",
    });

    const { rows } = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);

    if (!rows.length) return Promise.reject(EM.invalidCredentials);

    const validPassword = await bcrypt.compare(`${password}`, rows[0].password);

    if (!validPassword) return Promise.reject(EM.invalidCredentials);

    const token = jwt.sign(
      { username: rows[0].username },
      process.env.JWT_SECRET
    );

    return { token, username: rows[0].username };
    
  } catch (error) {
    return Promise.reject({ type: "PSQL", status: 403, message: "PSQL Error", error });
  }

};

exports.handleRegister = async (username, password) => {
  username = username.toLowerCase()

  try {
    
    if (!username || !password)
    return Promise.reject({
      status: 403,
      message: "Invalid Register Credentials - No Null Values",
    });
    
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

    return addedUser[0];

  } catch (error) {
    return Promise.reject({ type: "PSQL", status: 403, message: "PSQL Error", error });
  }

};