const server = require("./app");

const { PORT = 4000 } = process.env;

server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Listening at http://localhost:${PORT}...`);
});
