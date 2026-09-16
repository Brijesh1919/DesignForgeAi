import fs from "fs";
import path from "path";
import { WebSocket } from "ws";

const ARTIFACT_DIR = "C:\\Users\\brijesh9177\\.gemini\\antigravity-ide\\brain\\8000d952-161e-4a7c-b841-2198aa68e271";

function getBase64(filename) {
  const filePath = path.join(ARTIFACT_DIR, filename);
  const data = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

const heroBg = getBase64("hero_studio_bg_1789552153610.jpg");
const stripeUi = getBase64("stripe_billing_ui_1789552081166.jpg");
const linearUi = getBase64("linear_mobile_ui_1789552100524.jpg");
const raycastUi = getBase64("raycast_ai_ui_1789552115798.jpg");

console.log("Images loaded into base64 successfully:");
console.log("- Hero Bg length:", heroBg.length);
console.log("- Stripe UI length:", stripeUi.length);
console.log("- Linear UI length:", linearUi.length);
console.log("- Raycast UI length:", raycastUi.length);
