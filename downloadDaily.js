const fs = require("fs/promises");
const chapterCreator = require("./hiphopChapterCreator");

const SONGS_PATH = "./hiphop";

const CHOSEN_CHAPTERS = [
  {
    name: "Matthew",
    chapter: 23
  },
  {
    name: "Romans",
    chapter: 5
  },
  {
    name: "Psalms",
    chapter: 53
  },
  {
    name: "Numbers",
    chapter: 12
  },
];

(async () => {
  let songs = await fs.readdir(SONGS_PATH);
  let lastSongI = songs.length;
  for(let i = 0; i < CHOSEN_CHAPTERS.length; i++) {
    let chosenSongI = Math.floor(Math.random() * songs.length);
    if(chosenSongI >= lastSongI) {
      chosenSongI = chosenSongI + 1 < songs.length ? chosenSongI + 1 : 0;
    }
    await chapterCreator.createHiphopChapter(CHOSEN_CHAPTERS[i].name, CHOSEN_CHAPTERS[i].chapter, songs[chosenSongI]);
    lastSongI = chosenSongI;
  }
})();