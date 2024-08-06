import fs from "fs/promises";
import express from "express";
export const router = express.Router();


router.get("/", (req, res, next) => {
    res.send(indexHtml);
});

const indexHtml = await (async () => {
    const configFile = process.env["WOL_CONFIG"]!;

    const files = await Promise.all([
        fs.readFile("./templates/index.html", "utf-8"),
        fs.readFile(configFile, "utf-8"),
    ]);
    const template = files[0];
    const settings: { name: string, macAddress?: string, ping?: string, services?: { name: string, url: string }[] }[] = JSON.parse(files[1]);

    let generated = "";
    for (const device of settings) {
        generated += `
            <tr>
                <td class="ping" ${device.ping ? "data-ping=" + device.ping : ""}>❓</td>
                <td>${device.name}</td>
                <td>${device.macAddress ? "<button class=\"wake\" data-mac-address=\"" + device.macAddress + "\">Wake</button>" : ""}</td>
                <td>
                    <ul>
        `
        if (device.services) {
            for (const service of device.services) {
                generated += `
                        <li><a href="${service.url}">${service.name}</a></li>
                `
            }
        }
        generated += `
                    </ul>
                </td>   
            </tr>
        `
    }

    return template.replace("<!-- generate -->", generated);
})();