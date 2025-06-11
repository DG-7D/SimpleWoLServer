import { ping, wake } from "./routes/api.ts";
import { indexHtml } from "./routes/ui.ts";

const server = Bun.serve({
    routes: {
        "/":  new Response(indexHtml, { headers: { "Content-Type": "text/html" }, status: 200 }),
        "/api/ping": {
            GET: async req => {
                const hostname = new URL(req.url).searchParams.get("hostname");
                if (!hostname) {
                    return new Response("Bad Request: missing `hostname`", { status: 400 });
                }
                return Response.json({
                    responsed: await ping(hostname)
                });
            }
        },
        "/api/wake": {
            POST: async req => {
                const macAddress = await req.json().then(json => (json as any)?.macAddress).catch(() => null);
                if (typeof macAddress !== "string") {
                    return new Response("Bad Request: missing `macAddress`", { status: 400 });
                }
                wake(macAddress);
                return new Response(null, { status: 200 });
            }
        },
        "/*": async req => {
            const path = new URL(req.url).pathname;
            const file = Bun.file("./public" + path);
            if (!await file.exists()) {
                return new Response("Not Found", { status: 404 });
            }
            return new Response(file);
        }
    },
});

console.log(`🚀 Server running at ${server.url}`);