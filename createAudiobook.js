const ffmpeg = require("./ffmpegInterface");
const fs = require("fs/promises");
const chapterCreator = require("./hiphopChapterCreator");

const SONGS_PATH = "./hiphop";
const BOOK_PATH = "./audiobook";

const BOOK_TITLE = "TheBible";

(async () => {
  let plan = await loadJson("plan-parser/plan.json");
  let bookmark = await loadJson("bookmark.json");

  let songs = await fs.readdir(SONGS_PATH);
  let lastSongI = songs.length;
  let planIndex = bookmark.index;
  let chapterNum = bookmark.nextChapter;
  while(planIndex < plan.length) {
    let chosenSongI = Math.floor(Math.random() * songs.length);
    if(chosenSongI >= lastSongI) {
      chosenSongI = chosenSongI + 1 < songs.length ? chosenSongI + 1 : 0;
    }
    console.log("Creating", plan[planIndex].bookName, chapterNum, songs[chosenSongI], "...");
    let outputPath = await chapterCreator.createHiphopChapter(plan[planIndex].bookName, chapterNum, songs[chosenSongI]);

    await addToBook(outputPath);
    await fs.unlink(outputPath);

    lastSongI = chosenSongI;
    chapterNum++;
    bookmark.nextChapter++;
    if(chapterNum > (plan[planIndex].valueEnd || plan[planIndex].valueStart)) {
      planIndex++;
      chapterNum = plan[planIndex].valueStart;
      bookmark.index++;
      bookmark.nextChapter = plan[planIndex].valueStart;
    }
    await fs.writeFile("bookmark.json", JSON.stringify(bookmark));
  }
})();

async function addToBook(filePath) {
  const TITLE_MIDDLE = "Part";
  let parts = await fs.readdir(BOOK_PATH);
  let currPart = 0;
  for(let i = 0; i < parts.length; i++) {
    let filePart = parseInt(parts[i].substring(BOOK_TITLE.length + TITLE_MIDDLE.length));
    if(filePart > currPart) {
      currPart = filePart;
    }
  }
  let partPrefix = BOOK_PATH + "/" + BOOK_TITLE + TITLE_MIDDLE;
  //Is the current part more than an hour long?
  if(!currPart || await ffmpeg.getFileDuration(partPrefix + currPart + ".mp3") > 60 * 60) {
    currPart = currPart ? currPart + 1 : 1;
    console.log("Creating part " + currPart + "...");
    await fs.copyFile(filePath, partPrefix + currPart + ".mp3");
  }else{
    console.log("Adding to part " + currPart + "...");
    await ffmpeg.concat(partPrefix + currPart + ".mp3", partPrefix + currPart + ".mp3", filePath);
  }
  console.clear();
}

async function loadJson(path) {
  //TODO: Convert readWrite to fs promise
  let jsonRaw = await fs.readFile(path);
  return JSON.parse(jsonRaw);
}