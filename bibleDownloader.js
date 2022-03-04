const puppeteer = require('puppeteer');
const downloader = require('./downloader');
const fsSync = require("fs");

const DOMAIN = "https://www.biblegateway.com";
const URL = DOMAIN + "/passage/";

exports.downloadChapter = async function (bookName, chapter, downloadPath, waitForDownload) {
    if (waitForDownload) {
        let downloaded = false;
        if(downloadPath && downloadPath.substring(downloadPath.length - 1) != "/") {
            downloadPath += "/";
        }
        while (!downloaded) {
            await downloadChapter(bookName, chapter, downloadPath, true);
            downloaded = fsSync.existsSync(downloadPath + bookName + chapter + ".mp3");
        }
    } else {
        await downloadChapter(bookName, chapter, downloadPath, false);
    }
}

async function downloadChapter(bookName, chapter, downloadPath, waitForDownload) {
    const browser = await puppeteer.launch();
    const mainPage = (await browser.pages())[0];

    const btnPath = "body > div.nav-content > div > section > div:nth-child(4) > div > div.passage-resources > section > div.passage-table > div.passage-cols > div.passage-col-tools > div.passage-tools > a.audio-link";
    const sourcePath = "#audio-player-element > source:nth-child(1)";

    mainPage.goto(URL + "?search=" + bookName + "%20" + chapter + "&version=NIV");
    await mainPage.waitForSelector(btnPath);
    let pageUrl = await mainPage.$eval(btnPath, btn => btn.getAttribute("href"));
    pageUrl = DOMAIN + pageUrl.replace("mclean", "purevoice");
    mainPage.goto(pageUrl);
    await mainPage.waitForSelector(sourcePath);
    let audioSource = await mainPage.$eval(sourcePath, source => source.src);
    await downloader.downloadFile(audioSource, bookName + chapter + ".mp3", downloadPath, mainPage, waitForDownload, 500);

    await browser.close();
}