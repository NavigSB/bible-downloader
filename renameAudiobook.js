const fs = require("fs/promises");

const BOOK_PATH = "./audiobook";

const PART_PREFIX = "The Bible - Part ";
const EXT = ".mp3";

(async function() {
    let parts = await fs.readdir(BOOK_PATH);
    console.log(parts[0]);
    for(let i = 0; i < parts.length; i++) {
        let name = parts[i];
        let part = parseInt(name.substring(12));
        await fs.rename(BOOK_PATH + "/" + name, BOOK_PATH + "/" + PART_PREFIX + part + EXT);
    }
})();