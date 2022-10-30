const ENV = process.env.NODE_ENV || "development";

const { validateToken, groupAccess } = require("./middleware/auth");

require("dotenv").config({
  path: `${__dirname}/.env.${ENV}`,
});

const express = require("express");
const cors = require("cors");

const { handlePSQLerror, handleCustomError, uncaughtError } = require("./errors/errors");
const { postLogin, postRegister } = require("./controllers/auth");
const groupsRouter = require("./routes/groups");
const playersRouter = require("./routes/players");
const notesRouter = require("./routes/notes");

const app = express();

app.use(cors())
app.use(express.json());
const server = require("http").Server(app);

app.use(validateToken)

app.post("/auth/register", postRegister)
app.post("/auth/login", postLogin);
app.use("/groups", groupsRouter)
app.use("/players", playersRouter)
app.use("/notes", notesRouter)

app.use(handleCustomError);
app.use(handlePSQLerror);
app.use(uncaughtError);

module.exports = server;
