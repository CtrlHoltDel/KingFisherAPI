const ENV = process.env.NODE_ENV || "development";

require("dotenv").config({
  path: `${__dirname}/.env.${ENV}`,
});

const express = require("express");
const cors = require("cors");
const db = require("./db/connection");

const app = express()
const server = require("http").Server(app);

app.get("/", () => {
  
})

module.exports = server