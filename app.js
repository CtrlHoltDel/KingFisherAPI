const ENV = process.env.NODE_ENV || "development";

const { validateToken } = require("./middleware/auth");

require("dotenv").config({
  path: `${__dirname}/.env.${ENV}`,
});

const express = require("express");
const cors = require("cors");
const { handlePSQLerror, handleCustomError } = require("./errors/errors");
const { postLogin, postRegister } = require("./controllers/auth");
const groupsRouter = require("./routes/groups");
const playersRouter = require("./routes/players");

const app = express();
app.use(express.json());
const server = require("http").Server(app);

app.post("/auth/register", postRegister)
app.post("/auth/login", postLogin);

app.use(validateToken);

app.use("/groups", groupsRouter)
app.use("/players", playersRouter)

app.use(handleCustomError);
app.use(handlePSQLerror);

module.exports = server;
