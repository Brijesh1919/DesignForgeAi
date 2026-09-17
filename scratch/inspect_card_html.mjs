import fs from "fs";

const html = fs.readFileSync("c:/Users/brijesh9177/Desktop/Projects/photo-to-design/scratch/koox.html", "utf-8");

const pos = html.indexOf("The Signature Reset Cleanse");
if (pos !== -1) {
  console.log(html.slice(pos - 600, pos + 600));
} else {
  console.log("Not found");
}
