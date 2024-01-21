import http from "http";
import fs from "fs";
import dgram from "dgram";
import path from "path";
import { execSync } from "child_process";

const port = 3000;
const pingTimeout = 1000;

const basePath = "./dist/static"
const mimeTypes: { [key: string]: string } = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".txt": "text/plain",
};

http.createServer((request, response) => {

    console.log(`${request.method} ${request.url}`)

    if (request.url?.startsWith("/api")) {
        processApi(request, response);
        return;
    }

    if (request.method == "GET") {
        let filePath = basePath + request.url;
        filePath.endsWith("/") && (filePath += "index.html");
        console.log(`=> ${filePath}`);

        const extention = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[extention];

        fs.readFile(filePath, "utf-8", (error, content) => {
            if (!error) {
                response.writeHead(200, { "Content-Type": contentType });
                response.end(content);
                return;
            }
            if (error.code != "ENOENT") {
                response.writeHead(500);
                response.end();
                return;
            }
        });
        return;
    }

    response.writeHead(404);
    response.end();
    return;
})
    .listen(port, () => {
        console.log(`Server runnning at http://localhost:${port}/`);
    });

function processApi(request: http.IncomingMessage, response: http.ServerResponse) {
    const requestURL = new URL(request.url ?? "", `http://${request.headers.host}`);
    if (request.method == "GET" && requestURL.pathname == "/api/ping") {
        const hostname = requestURL.searchParams.get("hostname");
        if (hostname) {
            response.writeHead(200, { "content-type": mimeTypes[".json"] })
            response.end(JSON.stringify({
                responsed: ping(hostname),
            }));
            return;
        }
        response.writeHead(400, { "content-type": mimeTypes[".txt"] });
        response.end("bad request: missig `hostname`");
        return;
    }
    if (request.method == "POST" && requestURL.pathname == "/api/wake") {
        let requestBody = "";
        request.on("data", chunk => {
            requestBody += chunk.toString();
        });
        request.on("end", () => {
            try {
                const requestJson = JSON.parse(requestBody);
                if (requestJson.macAddress) {
                    wake(requestJson.macAddress);
                    response.writeHead(200);
                    response.end();
                    return;
                }
                response.writeHead(400, { "content-type": mimeTypes[".txt"] });
                response.end("bad request: missing `macAddress`");
                return;
            } catch {
                response.writeHead(400, { "content-type": mimeTypes[".txt"] });
                response.end("bad request: invalid JSON");
                return;
            }
        });
        return;
    }
    response.writeHead(404);
    response.end();
    return;
}

function wake(macAddress: string) {
    macAddress = macAddress.replaceAll(":", "").replaceAll("-", "");
    let macAddressBytes: number[] = [];
    for (let index = 0; index < macAddress.length; index += 2) {
        macAddressBytes.push(Number.parseInt(macAddress.slice(index, index + 2), 16));
    }

    const magicPacket = Buffer.alloc(102);
    magicPacket.fill(0xff, 0, 6);
    for (let index = 6; index < 102; index++) {
        magicPacket.writeUInt8(macAddressBytes[index % 6]!, index);
    }

    const socket = dgram.createSocket("udp4");
    socket.on("error", (error) => {
        console.error(error);
        socket.close();
    });
    socket.on("connect", () => {
        socket.send(magicPacket, 0, magicPacket.length);
        console.log(`magic packet sent to ${macAddress}`);
        socket.close();
    });
    socket.connect(9, "255.255.255.255");
}

function ping(hostname: string): boolean {
    console.log(`ping ${hostname}`);
    const pingCommand = process.platform == "win32" ? "ping -n 1" : "ping -c 1";
    try {
        execSync(`${pingCommand} ${hostname}`, { timeout: pingTimeout });
        return true;
    }
    catch (error) {
        return false;
    }
}