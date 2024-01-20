import http from "node:http";
import fs from "fs";
import dgram from "dgram";

const hostname = "0.0.0.0";
const port = 3000;

const server = http.createServer((request, response) => {
    console.log(request);
    if (request.method === "GET" && request.url === "/") {
        fs.readFile("index.html", "utf-8", (error, data) => {
            if (error) {
                response.writeHead(500, { "Content-Type": "text/plain" });
                response.end("Internal Server Error");
            } else {
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end(data, "utf-8");
            }
        })
    } else if (request.method === "POST" && request.url === "/wake") {
        let requestBody = "";
        request.on("data", chunk => {
            requestBody += chunk.toString();
        });
        request.on("end", () => {
            try {
                const requestJson = JSON.parse(requestBody);
                if (requestJson.macAddress) {
                    wake(requestJson.macAddress);
                    response.writeHead(200, { "content-type": "text/plain" });
                    response.end("success");
                } else {
                    response.writeHead(400, { "content-type": "text/plain" });
                    response.end("bad request: missing `macAddress`");
                }
            } catch {
                response.writeHead(400, { "content-type": "text/plain" });
                response.end("bad request: invalid JSON");
            }
        })
    } else {
        response.writeHead(404);
        response.end();
    }
});

server.listen(port, hostname, () => {
    console.log(`Server runnning at http://${hostname}:${port}/`);
})

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