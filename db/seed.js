const { dropTables, createTables } = require("./utils/create-db");

const fs = require("fs/promises");
const insertData = require("./utils/insert-data");
const db = require("./connection");

const createDatabaseStructure = async () => {
  try {
    console.log(`inserting data from ${process.env.DATA || "test-data"} into db ${process.env.NODE_ENV || "development"}`)

    await dropTables();
    await createTables();
    const data = await fs.readFile(`${__dirname}/data/${process.env.DATA || "test-data"}.json`)
    await insertData(JSON.parse(data))


    db.end()

  } catch (error) {
    console.log(error);
  }
};

createDatabaseStructure();
