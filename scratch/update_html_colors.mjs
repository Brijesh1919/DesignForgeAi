import fs from "fs";

function updateColors(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");

  content = content.replace(/#0a0b0d/gi, "#0B1F3A");
  content = content.replace(/#12141a/gi, "#0E2748");
  content = content.replace(/#111318/gi, "#0E2748");
  content = content.replace(/#060709/gi, "#061324");
  content = content.replace(/#f8f7f4/gi, "#F7F9FC");
  content = content.replace(/#f7f4ee/gi, "#F7F9FC");
  content = content.replace(/#e2ddd5/gi, "#DCE5F0");
  content = content.replace(/#ede8e1/gi, "#DCE5F0");
  content = content.replace(/#dcd7ce/gi, "#DCE5F0");
  content = content.replace(/#e9e5de/gi, "#DCE5F0");
  content = content.replace(/#636b78/gi, "#64748B");
  content = content.replace(/#555d6b/gi, "#64748B");
  content = content.replace(/#727a89/gi, "#64748B");
  content = content.replace(/#5c574c/gi, "#64748B");
  content = content.replace(/#00d084/gi, "#12B76A");
  content = content.replace(/#ff4621/gi, "#155EEF");
  content = content.replace(/#ff4b26/gi, "#155EEF");

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Updated colors in ${filePath}`);
}

updateColors("scratch/generate_visawala_design.mjs");
updateColors("scratch/generate_visawala_mobile.mjs");
