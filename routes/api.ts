const pingTimeout = 1000;

import dgram from "dgram";

export function ping(hostname: string) {
    const pingCommand = {
        raw: process.platform == "win32" ? `ping -n 1 -w ${pingTimeout}` : `ping -c 1 -W ${pingTimeout}`,
    };
    return Bun.$`${pingCommand} ${hostname}`.quiet().then(_ => true).catch(_ => false);
}

export function wake(macAddress: string) {
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
