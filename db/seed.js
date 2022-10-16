const { dropTables, createTables } = require("./utils/create-db");

const fs = require("fs/promises");
const insertData = require("./utils/insert-data");

const createDatabaseStructure = async () => {
  try {
    await dropTables();
    await createTables();

    const data = await fs.readFile(`${__dirname}/data/${process.env.DATA}.json`)
    await insertData(JSON.parse(data))




  } catch (error) {
    console.log(error);
  }
};

createDatabaseStructure();
