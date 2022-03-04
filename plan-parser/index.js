const fs = require('fs/promises');

const PART_MAP = [
    undefined,
    undefined,
    "bookName",
    "valueStart",
    undefined,
    "valueEnd"
];

(async function () {
    let pdfText = "" + (await fs.readFile("pdfText.txt"));
    const BOOK_MAP = JSON.parse(""+await fs.readFile("bookAbbrMap.json"));
    let plan = [{}];
    let part = 0;
    let day = 0;
    let text = pdfText.split("\n");
    for (let i = 0; i < text.length; i++) {
        text[i] = text[i].trim();
        if (text[i] == "") {
            text.splice(i, 1);
            i--;
        }
    }
    text.forEach((str, i, arr) => {
        let attr = PART_MAP[part];
        if (attr) {
            let changedStr = str;
            if (attr.includes("value")) {
                changedStr = parseInt(changedStr);
            }
            if(attr == "bookName") {
                changedStr = BOOK_MAP[changedStr];
            }
            plan[day][attr] = changedStr;
        }
        // Is this a value with a comma? Expect book name next
        if(attr && attr.includes("value") && str.includes(",")) {
            day++;
            part = 2;
            plan.push({});
        }else if (attr && attr == "valueStart" && arr[i + 1] != "-") {
            day++;
            part = 0;
            plan.push({});
        }else if (part + 1 >= PART_MAP.length) {
            day++;
            part = 0;
            plan.push({});
        }else{
            part++;
        }
    });
    plan.splice(plan.length - 1, 1);
    await fs.writeFile("plan.json", JSON.stringify(plan));
})();