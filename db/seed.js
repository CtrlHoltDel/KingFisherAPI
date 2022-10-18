const { dropTables, createTables } = require("./utils/create-db");
const insertData = require("./utils/insert-data");

const seed = async (data) => {
  try {
    await dropTables();
    console.log("here")
    await createTables();
    await insertData(data);
    console.log("here")
  } catch (error) {
    console.log(error);
  }
};

module.exports = seed;