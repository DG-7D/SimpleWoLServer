import fs from "fs";

const configFile = process.env["WOL_CONFIG"];

let html = fs.readFileSync("./src/index.html", "utf-8");
const settings: { name: string, macAddress: string, ping?: string, services?: { name: string, url: string }[] }[] = JSON.parse(fs.readFileSync(configFile!, "utf-8"));
let generated = "";

for (const device of settings) {
    generated += `
        <tr ${device.ping ? "data-ping=" + device.ping : ""}>
            <td class="ping">❓</td>
            <td>${device.name}</td>
            <td><button class="wake" data-mac-address="${device.macAddress}">Wake</button></td>
            <td>
                <ul>
    `
    if (device.services) {
        for (const service of device.services) {
            generated += `
                    <li><a href="${service.url}">${service.name}</a></li>
            `
        }
        generated += `
                </ul>
            </td>   
        </tr>
        `
    }
}

html = html.replace("<!-- generate -->", generated);

fs.writeFileSync("./dist/index.html", html);