const ENV = process.env.NODE_ENV || "development";

const { validateToken } = require("./middleware/auth");

require("dotenv").config({
  path: `${__dirname}/.env.${ENV}`,
});

const express = require("express");
const cors = require("cors");
const { handleError } = require("./errors/errors");
const { postLogin, postRegister } = require("./controllers/auth");
const groupsRouter = require("./routes/groups");

const app = express();
app.use(express.json());
const server = require("http").Server(app);

app.post("/auth/login", postLogin);
app.post("/auth/register", postRegister)

app.use(validateToken);

app.use("/groups", groupsRouter)

app.use(handleError);

module.exports = server;
