const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "site-data.json");
const APPOINTMENTS_FILE = path.join(ROOT, "data", "appointments.json");

const PAGE_ROUTES = {
  "/": "index.html",
  "/about": "about.html",
  "/about-salon": "about.html",
  "/services": "services.html",
  "/bridal-services": "bridal.html",
  "/gallery": "gallery.html",
  "/reviews": "reviews.html",
  "/book-appointment": "book.html",
  "/contact": "contact.html"
};

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8"
};

function loadSiteData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function ensureAppointmentsFile() {
  if (!fs.existsSync(APPOINTMENTS_FILE)) {
    fs.writeFileSync(APPOINTMENTS_FILE, "[]\n", "utf8");
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function serveFile(res, filePath) {
  try {
    const content = await fsp.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Server error");
  }
}

function isJsonRequest(req, url) {
  const accept = req.headers.accept || "";
  return url.searchParams.get("format") === "json" || accept.includes("application/json");
}

function resolveStaticPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const filePath = path.normalize(path.join(ROOT, decodedPath));
  if (!filePath.startsWith(ROOT)) {
    return null;
  }
  return filePath;
}

async function appendAppointment(payload) {
  ensureAppointmentsFile();
  const current = JSON.parse(await fsp.readFile(APPOINTMENTS_FILE, "utf8"));
  current.push(payload);
  await fsp.writeFile(APPOINTMENTS_FILE, `${JSON.stringify(current, null, 2)}\n`, "utf8");
}

function validateAppointment(payload) {
  const required = ["name", "phone", "service", "date", "time"];
  return required.every((field) => typeof payload[field] === "string" && payload[field].trim());
}

function createServer() {
  ensureAppointmentsFile();

  return http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, "http://localhost:3000");
    const { pathname } = requestUrl;
    const method = req.method || "GET";

    if (method === "GET" && ["/assets/", "/images/", "/data/"].some((prefix) => pathname.startsWith(prefix))) {
      const filePath = resolveStaticPath(pathname);
      if (!filePath) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Forbidden");
        return;
      }
      await serveFile(res, filePath);
      return;
    }

    if (method === "GET" && ["/robots.txt", "/sitemap.xml"].includes(pathname)) {
      await serveFile(res, path.join(ROOT, pathname.slice(1)));
      return;
    }

    if (method === "GET" && ["/services", "/reviews", "/gallery"].includes(pathname) && isJsonRequest(req, requestUrl)) {
      const siteData = loadSiteData();
      sendJson(res, 200, siteData[pathname.slice(1)]);
      return;
    }

    if (method === "POST" && pathname === "/book-appointment") {
      const body = await readBody(req);

      try {
        const appointment = JSON.parse(body);
        if (!validateAppointment(appointment)) {
          sendJson(res, 400, { success: false, message: "Please complete all required fields." });
          return;
        }

        const record = {
          id: `LUS-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...appointment
        };

        await appendAppointment(record);
        sendJson(res, 201, {
          success: true,
          message: "Your appointment request has been received.",
          appointment: record
        });
      } catch {
        sendJson(res, 400, { success: false, message: "Invalid booking payload." });
      }
      return;
    }

    if (method === "GET" && PAGE_ROUTES[pathname]) {
      await serveFile(res, path.join(ROOT, "pages", PAGE_ROUTES[pathname]));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const server = createServer();
  server.listen(port, () => {
    console.log(`Lotus Unisex Salon site running on http://localhost:${port}`);
  });
}

module.exports = { createServer };
