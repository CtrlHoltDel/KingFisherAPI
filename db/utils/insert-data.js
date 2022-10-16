const db = require("../connection");
const format = require("pg-format");
const bcrypt = require("bcryptjs");

const insertData = async ({ users, notes, players, note_group, note_group_junction }) => {

    const usersQuery = format(
        `INSERT INTO users(id, username, password) VALUES %L`,
        users.map((user) => {
            return [
            user.username,
            user.password,
            user.admin,
            user.validated,
            user.u_created_at
            ];
        })
    );

}

module.exports = insertData