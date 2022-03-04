const fs = require("fs");
const path = require("path");

exports.downloadFile = async function (url, fileName, downloadPath, page, waitUntilFinished = false, fileCheckTimeout = 5000) {
    const DOWNLOAD_PATH = path.resolve(downloadPath);
    await page._client.send('Page.setDownloadBehavior',
        { behavior: 'allow', downloadPath: DOWNLOAD_PATH }
    );
    page.goto(url);
    await page.waitForSelector("source");
    await page.waitForTimeout(1000);
    await page.evaluate(async (url, fileName) => {
        let link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
    }, url, fileName);
    if (waitUntilFinished) {
        while (true) {
            await new Promise((resolve) => {
                setTimeout(resolve, fileCheckTimeout);
            });
            if (await checkFilesDownloaded(downloadPath)) {
                break;
            }
        }
    }
}

async function checkFilesDownloaded(path) {
    return new Promise(async (resolve, reject) => {
        let noOfFile;
        try {
            noOfFile = await fs.readdirSync(path);
        } catch (err) {
            return reject(err);
        }
        for (let i in noOfFile) {
            if (noOfFile[i].includes('.crdownload')) {
                resolve(false);
            }
        }
        resolve(true);
    });
}