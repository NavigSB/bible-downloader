const ffmpeg = require("./ffmpegInterface");
const bibleDownloader = require("./bibleDownloader");
const fs = require("fs/promises");

const DOWNLOAD_PATH = "./downloads";
const CHAPTERS_PATH = "./chapters";
const SONGS_PATH = "./hiphop";

exports.createHiphopChapter = async function (book, chapter, song) {
    if (book.includes(" ")) {
        book = book.replaceAll(" ", "");
    }
    await bibleDownloader.downloadChapter(book, chapter, DOWNLOAD_PATH, true);

    let songPath = SONGS_PATH + "/" + song;
    let chapterName = book + chapter + ".mp3";
    let chapterPath = DOWNLOAD_PATH + "/" + chapterName;
    let chapterLength = await ffmpeg.getFileDuration(chapterPath);
    let chapterEnd = await ffmpeg.getFileDuration(chapterPath, true);
    let introLength = await ffmpeg.getFileDuration(songPath + "/Intro.mp3");
    let loopLength = await ffmpeg.getFileDuration(songPath + "/Loop.mp3");
    let loopCount = Math.ceil((chapterLength - introLength) / loopLength);
    let outputPath = CHAPTERS_PATH + "/" + chapterName;
    let concatArr = [songPath + "/Intro.mp3"];
    for (let i = 0; i < loopCount; i++) {
        concatArr.push(songPath + "/Loop.mp3");
    }
    await ffmpeg.concat(outputPath, ...concatArr);
    await ffmpeg.clip(outputPath, undefined, undefined, chapterEnd);
    await ffmpeg.fadeOut(outputPath);
    await ffmpeg.merge(outputPath, outputPath, DOWNLOAD_PATH + "/" + chapterName);

    await fs.unlink(chapterPath);

    return outputPath;
}