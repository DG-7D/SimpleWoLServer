import dgram from "dgram";
const exec = util.promisify((await import("child_process")).exec);
import http from "http";
import util from "util";

import mimeTypes from "./mimeTypes";

const pingTimeout = 1000;

export default {
    response: response,
};

async function response(request: http.IncomingMessage, response: http.ServerResponse) {
    const requestURL = new URL(request.url ?? "", `http://${request.headers.host}`);

    if (request.method == "GET" && requestURL.pathname == "/api/ping") {
        const hostname = requestURL.searchParams.get("hostname");
        if (hostname) {
            response.writeHead(200, { "content-type": mimeTypes[".json"] })
            response.end(JSON.stringify({
                responsed: await ping(hostname),
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

function ping(hostname: string) {
    console.log(`ping ${hostname}`);
    const pingCommand = process.platform == "win32" ? "ping -n 1" : "ping -c 1";
    return exec(`${pingCommand} ${hostname}`, { timeout: pingTimeout })
        .then(() => true)
        .catch(() => false);
}