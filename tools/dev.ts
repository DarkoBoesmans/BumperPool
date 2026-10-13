// Local play: builds dist/, serves it on http://localhost:5173 and builds again when you save a file.
import { watch } from "node:fs";
import { buildAll, OUT } from "./build";

const PORT = Number(process.env.PORT) || 5173;
await buildAll({ minify: false });

let timer: ReturnType<typeof setTimeout> | undefined;
for (const dir of ["src", "styles", "html", "index.html", "legal.html"])
  watch(dir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => void buildAll({ minify: false }), 80);
  });

Bun.serve({
  port: PORT,
  async fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = Bun.file(OUT + path.replace(/\.\.+/g, ""));
    return (await file.exists()) ? new Response(file) : new Response("not found", { status: 404 });
  },
});
console.log(`tjoepbiljart on http://localhost:${PORT}`);
