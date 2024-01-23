import fs from "fs/promises";
import http from "http";
import path from "path";

import api from "./api.js"
import generator from "./generator.js";
import mimeTypes from "./mimeTypes.js";

const port = 3000;
const staticPath = "./public/static"

http.createServer((request, response) => {
    console.log(`${request.method} ${request.url}`)

    if (request.url?.startsWith("/api")) {
        api.response(request, response);
        return;
    }

    if (request.method == "GET") {
        webResponse(request, response);
        return;
    }

    response.writeHead(404);
    response.end();
    return;
})
    .listen(port, () => {
        console.log(`Server runnning at http://localhost:${port}/`);
    });

function webResponse(request: http.IncomingMessage, response: http.ServerResponse) {
    let filePath = request.url ?? "";
    if (filePath.endsWith("/")) filePath += "index.html";

    const extention = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extention];

    if (generator.generated[filePath]) {
        response.writeHead(200, { "Content-Type": contentType });
        response.end(generator.generated[filePath]);
        return;
    }

    filePath = staticPath + filePath;
    fs.readFile(filePath, "utf-8")
        .then((content) => {
            response.writeHead(200, { "Content-Type": contentType });
            response.end(content);
            return;
        })
        .catch((reason) => {
            if (reason.code != "ENOENT") {
                response.writeHead(500);
                response.end();
                return;
            }
            response.writeHead(404);
            response.end();
            return;
        });

}