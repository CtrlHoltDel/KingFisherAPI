const seed = require("./seed");
const fs = require("fs/promises");
const db = require("./connection");

const manualSeed = async () => {
    const data = await fs.readFile(`${__dirname}/data/${process.env.DATA || "test-data"}.json`)
    await seed(JSON.parse(data));
    db.end()
}

manualSeed();