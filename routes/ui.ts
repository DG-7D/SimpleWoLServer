export const indexHtml = await (async () => {
    const configFile = Bun.file(process.env["WOL_CONFIG"] ?? "");
    const settings: { name: string, macAddress?: string, ping?: string, services?: { name: string, url: string }[] }[] = await configFile.json();

    const template = await Bun.file("./templates/index.html").text();

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