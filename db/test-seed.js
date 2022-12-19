const seed = require("./seed");
const fs = require("fs/promises");

const seedTest = async () => {
    const data = await fs.readFile(`${__dirname}/data/${process.env.DATA || "test-data"}.json`)

    await seed(JSON.parse(data));
}

module.exports = seedTest