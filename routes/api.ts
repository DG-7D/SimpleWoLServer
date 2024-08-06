const pingTimeout = 1000;

import dgram from "dgram";
import express from "express";
import util from "util";
const exec = util.promisify((await import("child_process")).exec);

export const router = express.Router();

router.get("/ping", async (req, res, next) => {
    const hostname = req.query["hostname"];
    if (typeof (hostname) == "string") {
        res.json({
            responsed: await ping(hostname),
        });
    } else {
        res.status(400).send("bad request: missig `hostname`");
    }
})

router.post("/wake", (req, res, next) => {
    const macAddress = req.body.macAddress;
    if (typeof (macAddress) == "string") {
        wake(macAddress);
        res.status(200).end();
    } else {
        res.status(400).send("bad request: missing `macAddress`");
    }
})

function ping(hostname: string) {
    const pingCommand = process.platform == "win32" ? "ping -n 1" : "ping -c 1";
    return exec(`${pingCommand} ${hostname}`, { timeout: pingTimeout })
        .then(() => true)
        .catch(() => false);
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
        socket.close();
    });
    socket.connect(9, "255.255.255.255");
}
