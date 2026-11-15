// Local stand-in for the Matterport Model API, used only by the e2e run. Synthetic data, not Matterport's.
import http from "node:http";

const AUTH = `Basic ${Buffer.from("e2e-key:e2e-secret").toString("base64")}`;
const ROOMS = {
  // Unit model: one usable imperial room, one with null width, one with zero depth.
  TESTUNIT01: [
    { id: "r-living", label: "Living room", dimensionEstimates: { area: 120, width: 10, depth: 12, height: 9, units: "imperial" } },
    { id: "r-null", label: "Hall", dimensionEstimates: { area: 20, width: null, depth: 4, height: 9, units: "imperial" } },
    { id: "r-zero", label: "Closet", dimensionEstimates: { area: 0, width: 3, depth: 0, height: 9, units: "imperial" } },
  ],
};
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    if (req.headers.authorization !== AUTH) { res.statusCode = 401; return res.end('{"error":"unauthorized"}'); }
    const id = JSON.parse(body || "{}").variables?.id;
    const rooms = ROOMS[id];
    if (!rooms) return res.end(JSON.stringify({ errors: [{ message: "Not Found", extensions: { code: "not.found" } }], data: {} }));
    res.end(JSON.stringify({ data: { model: { rooms } } }));
  });
}).listen(4010, () => console.log("matterport stub on 4010"));
