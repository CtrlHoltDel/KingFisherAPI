const seed = require("./seed");
const fs = require("fs/promises");
const db = require("./connection");

const manualSeed = async () => {
    const general = await fs.readFile(`${__dirname}/data/${process.env.DATA || "formatted-data"}.json`)
    const history = await fs.readFile(`${__dirname}/data/history.json`);

    await seed({ ...JSON.parse(general), history: JSON.parse(history) });
    db.end()
}

manualSeed();