const { dropTables, createTables } = require("./utils/create-db");
const insertData = require("./utils/insert-data");

const seed = async (data) => {
  try {
    await dropTables();
    await createTables();
    await insertData(data);
  } catch (error) {
    console.log(error);
  }
};

module.exports = seed;