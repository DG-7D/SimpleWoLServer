import fs from "fs";

let html = fs.readFileSync("./src/index.html", "utf-8");
const settings: { name: string, macAddress: string }[] = JSON.parse(fs.readFileSync("./wol-config-sample.json", "utf-8"));
let generated = "";

for (const device of settings) {
    generated += `<li>${device.name}: <button class="wake" data-mac-address="${device.macAddress}">wake</button></li>`
}

html = html.replace("<!-- generate -->", generated);

fs.writeFileSync("./dist/index.html", html);