const ENV = process.env.NODE_ENV || "development";

const db = require("./db/connection");

const { validateToken } = require("./middleware/auth");

require("dotenv").config({
  path: `${__dirname}/.env.${ENV}`,
});

const express = require("express");
const cors = require("cors");
const { handleError } = require("./errors/errors");
const { postLogin, postRegister } = require("./controllers/auth");

const app = express();
app.use(express.json());
const server = require("http").Server(app);

app.post("/auth/login", postLogin);
app.post("/auth/register", postRegister)

app.use(validateToken);

app.get("/groups", async (req, res, next) => {
  const { rows } = await db.query(
    `SELECT ngj.note_group, ngj.username, ng.name FROM "note_group_junction" ngj JOIN "note_group" ng ON ng.id = ngj.note_group WHERE username = $1`,
    ["ctrlholtdel"]
  );

  res.send({ rows });
});

app.use(handleError);

module.exports = server;
