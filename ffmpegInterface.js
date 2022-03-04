
const { spawn } = require("child_process");
const stringArgv = require("string-argv");
const fs = require("fs/promises");

const DEBUG = false;

exports.fadeOut = async function (inputFile, outputPath, fadeStartFromEnd = 5) {
    async function fadeOut(inputFile, outputPath, fadeStartFromEnd = 5) {
        if (!inputFile) {
            console.error("Ffmpeg: cannot fade out with no input. (ffmpegInterface.fadeOut)");
            return;
        }
        let inputDuration = await exports.getFileDuration(inputFile);
        let fadeStart = inputDuration - fadeStartFromEnd;
        let argStr = `-i ${inputFile} -filter_complex "afade=t=out:st=${fadeStart}:d=${fadeStartFromEnd}"`;
        argStr += ` -map_metadata -1 -y ${outputPath}`;
        await exports.executeFfmpeg(argStr);
        await exports.clip(outputPath, undefined, undefined, inputDuration);
    }

    if(!outputPath) {
        await ffmpegInPlace(inputFile, fadeOut, Array.from(arguments), 1);
    }else{
        await fadeOut(...arguments);
    }
}

exports.merge = async function (outputPath, ...inputPaths) {
    async function merge(outputPath, ...inputPaths) {
        if (!inputPaths.length) {
            console.error("Ffmpeg: cannot merge with zero files. (ffmpegInterface.merge)");
            return;
        }
        if (!outputPath) outputPath = inputFile;
    
        let argStr = "";
        for (let i = 0; i < inputPaths.length; i++) {
            argStr += "-i " + inputPaths[i] + " ";
        }
        argStr += `-filter_complex amix=inputs=${inputPaths.length}`;
        argStr += ` -map_metadata -1 -y ${outputPath}`;
    
        await exports.executeFfmpeg(argStr);
    }

    let twinIndex = inputPaths.indexOf(outputPath)
    if(twinIndex != -1) {
        await ffmpegInPlace(inputPaths[twinIndex], merge, Array.from(arguments), 0);
    }else{
        await merge(...arguments);
    }
}

exports.clip = async function (inputFile, outputPath, start, end) {
    async function clip(inputFile, outputPath, start, end) {
        if (!inputFile) {
            console.error("Ffmpeg: cannot clip with no input. (ffmpegInterface.clip)");
            return;
        }
        if (!outputPath) outputPath = inputFile;
    
        let argStr = `-i ${inputFile} -ss ${start || "00:00:00"}`;
        if (end) {
            argStr += ` -to ${end}`;
        }
        argStr += ` -acodec copy -map_metadata -1 -y ${outputPath}`;
        await exports.executeFfmpeg(argStr);
    }

    if(!outputPath) {
        await ffmpegInPlace(inputFile, clip, Array.from(arguments), 1);
    }else{
        await clip(...arguments);
    }
}

exports.concat = async function (outputPath, ...filePaths) {
    async function concat(outputPath, ...filePaths) {
        if (!filePaths.length) {
            console.error("Ffmpeg: cannot concat with zero files. (ffmpegInterface.concat)");
            return;
        }
        if (!outputPath) outputPath = inputFile;
    
        let fullInputStr = "";
        for (let i = 0; i < filePaths.length; i++) {
            fullInputStr += filePaths[i] + "|";
        }
        fullInputStr = fullInputStr.substring(0, fullInputStr.length - 1);
    
        const argStr = `-i "concat:${fullInputStr}" -acodec copy -map_metadata -1 -y ${outputPath}`;
        try {
            await exports.executeFfmpeg(argStr);
        } catch (e) {
            console.error(e);
        }
    }
    
    let twinIndex = filePaths.indexOf(outputPath)
    if(twinIndex != -1) {
        await ffmpegInPlace(filePaths[twinIndex], concat, Array.from(arguments), 0);
    }else{
        await concat(...arguments);
    }
}

exports.getFileDuration = function (inputFile, timeStampFormat = false) {
    if (!inputFile) {
        console.error("Ffmpeg: cannot get duration with no input. (ffmpegInterface.getFileDuration)");
        return;
    }
    return new Promise((resolve, reject) => {
        let argStr = `-i ${inputFile} -show_entries format=duration -v quiet -of csv=p=0`;
        if (timeStampFormat) {
            argStr += " -sexagesimal";
        }
        const ffprobeInstance = spawn("ffprobe", stringArgv.parseArgsStringToArgv(argStr));
        let output = "";
        ffprobeInstance.stdout.setEncoding("utf8");
        ffprobeInstance.stderr.setEncoding("utf8");
        ffprobeInstance.stdout.on("data", data => {
            if (DEBUG) console.log(data)
            output = data;
            if (!timeStampFormat) data = parseFloat(data);
        });
        ffprobeInstance.stderr.on("error", err => {
            if (DEBUG) console.log(err);
            reject(err);
        });
        if (DEBUG) {
            ffprobeInstance.stderr.on("data", err => console.log(err));
        }
        ffprobeInstance.on("close", () => resolve(output));
    }).catch(e => {
        if (DEBUG) console.error(e);
    });
}

exports.executeFfmpeg = function (argStr) {
    return new Promise((resolve, reject) => {
        const ffmpegInstance = spawn("ffmpeg", stringArgv.parseArgsStringToArgv(argStr));
        ffmpegInstance.stderr.setEncoding("utf8");
        ffmpegInstance.stdout.setEncoding("utf8");
        if (DEBUG) {
            ffmpegInstance.stdout.on("data", data => console.log(data));
            ffmpegInstance.stderr.on("data", err => console.log(err));
        }
        ffmpegInstance.stderr.on("error", err => {
            if (DEBUG) console.log(err);
            reject(err);
        });
        ffmpegInstance.on("close", () => resolve());
    }).catch(e => {
        if (DEBUG) console.error(e);
    });
}

async function ffmpegInPlace(inputPath, callback, params, paramOutputIndex) {
    let inputParts = inputPath.split(".");
    let ext = inputParts[inputParts.length - 1];
    let newPath = inputPath.substring(0, inputPath.length - ext.length) + "temp." + ext;
    params[paramOutputIndex] = newPath;
    await callback(...params);
    await fs.unlink(inputPath);
    await fs.rename(newPath, inputPath);
}