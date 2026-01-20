const http = require("http");
const facilities = require("./data");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

// Helper Function
function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

http.createServer((request, response) => {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  if (request.method !== "GET") return sendJson(response, 405, { error: "Only GET requests are allowed" });

  const url = new URL(request.url, "http://localhost");
  const path = url.pathname;

  if (path === "/v1/facilities") {
    let results = facilities;

    const region = url.searchParams.get("region");
    const category = url.searchParams.get("category");
    const query = url.searchParams.get("q");

    if (region) results = results.filter(f => f.region === region);
    if (category) results = results.filter(f => f.category === category);

    if (query) {
      const search = query.toLowerCase();
      results = results.filter(f => (f.name + f.address).toLowerCase().includes(search));
    }

    const total = results.length;
    const limit = Math.min(toPositiveInt(url.searchParams.get("limit"), 20), 100);
    const offset = toPositiveInt(url.searchParams.get("offset"), 0);

    const data = results.slice(offset, offset + limit);

    const params = new URLSearchParams(url.searchParams);
    params.set("limit", String(limit));

    const makeLink = (newOffset) => {
      const p = new URLSearchParams(params);
      p.set("offset", String(newOffset));
      return `/v1/facilities?${p.toString()}`;
    };

    const next = offset + limit < total ? makeLink(offset + limit) : null;
    const prev = offset > 0 ? makeLink(Math.max(0, offset - limit)) : null;

    return sendJson(response, 200, {
      data,
      meta: { total, limit, offset },
      links: { self: `/v1/facilities?${url.searchParams.toString()}`, next, prev }
    });
  }

  if (path.startsWith("/v1/facilities/")) {
    const facilityId = path.split("/")[3];
    const facility = facilities.find(f => f.id === facilityId);

    if (!facility) return sendJson(response, 404, { error: "Facility not found" });
    return sendJson(response, 200, { data: facility });
  }

  return sendJson(response, 404, { error: "Route not found" });
}).listen(process.env.PORT || 3000, () => {
  console.log("Civic Data API running on http://localhost:3000");
});
