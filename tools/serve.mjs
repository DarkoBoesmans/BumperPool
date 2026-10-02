// Tiny static server for local development (ES modules don't load from file://). Works with Bun and Node.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(
  import.meta.dirname ?? new URL(".", import.meta.url).pathname,
  "..",
);
const port = Number(process.env.PORT) || 5173;
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

createServer(async (req, res) => {
  const path = normalize(
    decodeURIComponent(new URL(req.url, "http://x").pathname),
  ).replace(/^([/\\])+/, "");
  const file = join(
    root,
    path === "" || path.endsWith("/") ? join(path, "index.html") : path,
  );
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res
      .writeHead(200, {
        "content-type": types[extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
      })
      .end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(port, () => console.log(`Golfbiljart on http://localhost:${port}`));
