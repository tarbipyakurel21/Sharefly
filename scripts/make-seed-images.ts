/* Generates neutral illustrated placeholders (original artwork, no third-party assets) into public/seed. */
import sharp from "sharp";
import fs from "node:fs";

const W = 800, H = 600;
type Draw = (c: { wood: string; accent: string }) => string;
const floor = (c: string) => `<rect y="430" width="${W}" height="170" fill="${c}"/>`;
const shadow = (x: number, w: number) => `<ellipse cx="${x}" cy="505" rx="${w}" ry="14" fill="#000" opacity=".12"/>`;

const items: Record<string, { bg: string; floor: string; wood: string; accent: string; svg: Draw }> = {
  "demo-desk": { bg: "#efe6d8", floor: "#d9c7ab", wood: "#a9764a", accent: "#6d4a2c", svg: ({ wood, accent }) => `
    ${shadow(400, 270)}
    <rect x="170" y="290" width="460" height="26" rx="4" fill="${wood}"/>
    <rect x="190" y="316" width="22" height="190" fill="${accent}"/><rect x="588" y="316" width="22" height="190" fill="${accent}"/>
    <rect x="212" y="316" width="150" height="120" rx="4" fill="${wood}" stroke="${accent}" stroke-width="3"/>
    <rect x="232" y="338" width="110" height="30" rx="3" fill="${accent}" opacity=".35"/><rect x="232" y="380" width="110" height="30" rx="3" fill="${accent}" opacity=".35"/>
    <circle cx="287" cy="353" r="5" fill="#e8d9bd"/><circle cx="287" cy="395" r="5" fill="#e8d9bd"/>` },
  chair: { bg: "#e9eef0", floor: "#cfd8d6", wood: "#5b7a74", accent: "#3f5752", svg: ({ wood, accent }) => `
    ${shadow(400, 130)}<rect x="320" y="250" width="160" height="26" rx="8" fill="${wood}"/><rect x="330" y="120" width="140" height="130" rx="12" fill="${wood}"/>
    <rect x="335" y="276" width="14" height="230" fill="${accent}"/><rect x="451" y="276" width="14" height="230" fill="${accent}"/>` },
  sofa: { bg: "#efe9e4", floor: "#d8cdc2", wood: "#7d8aa0", accent: "#5c6a82", svg: ({ wood, accent }) => `
    ${shadow(400, 290)}<rect x="150" y="230" width="500" height="170" rx="30" fill="${wood}"/><rect x="110" y="300" width="80" height="150" rx="26" fill="${accent}"/>
    <rect x="610" y="300" width="80" height="150" rx="26" fill="${accent}"/><rect x="190" y="330" width="420" height="110" rx="20" fill="${wood}" stroke="${accent}" stroke-width="3"/>
    <rect x="160" y="450" width="18" height="50" fill="#3a3329"/><rect x="622" y="450" width="18" height="50" fill="#3a3329"/>` },
  bookshelf: { bg: "#ece8e1", floor: "#d6ccb9", wood: "#8a6a47", accent: "#5f4630", svg: ({ wood, accent }) => `
    ${shadow(400, 150)}<rect x="290" y="90" width="220" height="410" fill="${wood}"/><rect x="302" y="102" width="196" height="386" fill="#f4ede0"/>
    ${[190, 280, 370].map((y) => `<rect x="302" y="${y}" width="196" height="10" fill="${accent}"/>`).join("")}
    ${[[310, 130, "#b95c50"], [334, 120, "#5b7a74"], [358, 134, "#d6a24c"], [316, 222, "#7d8aa0"], [342, 214, "#b95c50"], [380, 230, "#5b7a74"], [320, 312, "#d6a24c"], [350, 308, "#7d8aa0"]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="20" height="${190 - +y > 60 ? 54 : 56}" fill="${c}"/>`).join("")}` },
  lamp: { bg: "#f0e9dc", floor: "#dccfb6", wood: "#e8c36a", accent: "#3a3329", svg: ({ wood, accent }) => `
    ${shadow(400, 80)}<polygon points="330,120 470,120 500,250 300,250" fill="${wood}"/><rect x="394" y="250" width="12" height="230" fill="${accent}"/><ellipse cx="400" cy="486" rx="70" ry="12" fill="${accent}"/>` },
  dresser: { bg: "#e8e4ee", floor: "#cfc8d8", wood: "#b8946a", accent: "#7a5d3b", svg: ({ wood, accent }) => `
    ${shadow(400, 230)}<rect x="190" y="200" width="420" height="290" rx="6" fill="${wood}"/>
    ${[215, 290, 365].map((y) => `<rect x="206" y="${y}" width="388" height="66" rx="4" fill="${wood}" stroke="${accent}" stroke-width="3"/><circle cx="400" cy="${y + 33}" r="6" fill="${accent}"/>`).join("")}
    <rect x="210" y="490" width="16" height="20" fill="${accent}"/><rect x="574" y="490" width="16" height="20" fill="${accent}"/>` },
  table: { bg: "#edf0e8", floor: "#d3d9c6", wood: "#c49a6c", accent: "#8a6a47", svg: ({ wood, accent }) => `
    ${shadow(400, 230)}<ellipse cx="400" cy="300" rx="230" ry="46" fill="${wood}"/><rect x="392" y="320" width="16" height="170" fill="${accent}"/><ellipse cx="400" cy="492" rx="90" ry="14" fill="${accent}"/>` },
  bed: { bg: "#eee8e8", floor: "#d9cbcb", wood: "#9a7b5a", accent: "#c9d2dc", svg: ({ wood, accent }) => `
    ${shadow(400, 300)}<rect x="130" y="210" width="540" height="40" fill="${wood}"/><rect x="130" y="250" width="540" height="150" rx="14" fill="${accent}"/>
    <rect x="150" y="262" width="150" height="50" rx="14" fill="#fff"/><rect x="130" y="400" width="26" height="100" fill="${wood}"/><rect x="644" y="400" width="26" height="100" fill="${wood}"/>` },
  rug: { bg: "#f1ebe2", floor: "#e2d6c2", wood: "#b95c50", accent: "#e8c36a", svg: ({ wood, accent }) => `
    <polygon points="170,520 630,520 700,440 100,440" fill="${wood}"/><polygon points="215,505 585,505 640,455 160,455" fill="none" stroke="${accent}" stroke-width="8"/>` },
  kitchenware: { bg: "#e9efef", floor: "#cdd9d9", wood: "#6d7a82", accent: "#3a3329", svg: ({ wood, accent }) => `
    ${shadow(400, 200)}<ellipse cx="380" cy="400" rx="170" ry="40" fill="${wood}"/><rect x="210" y="320" width="340" height="80" fill="${wood}"/><ellipse cx="380" cy="320" rx="170" ry="40" fill="#8c999f"/>
    <rect x="550" y="335" width="130" height="20" rx="8" fill="${accent}"/>` },
  books: { bg: "#efe8dd", floor: "#dacdb6", wood: "#b95c50", accent: "#5b7a74", svg: () => `
    ${shadow(400, 180)}<rect x="260" y="420" width="280" height="40" fill="#5b7a74"/><rect x="270" y="380" width="260" height="40" fill="#d6a24c"/><rect x="250" y="340" width="290" height="40" fill="#b95c50"/><rect x="275" y="300" width="240" height="40" fill="#7d8aa0"/>` },
  electronics: { bg: "#e8ebef", floor: "#ccd2da", wood: "#2f3640", accent: "#8fa1b3", svg: ({ wood, accent }) => `
    ${shadow(400, 160)}<rect x="230" y="170" width="340" height="220" rx="10" fill="${wood}"/><rect x="244" y="184" width="312" height="192" fill="${accent}"/><rect x="380" y="390" width="40" height="70" fill="${wood}"/><rect x="330" y="460" width="140" height="14" rx="6" fill="${wood}"/>` },
  storage: { bg: "#ebeee6", floor: "#d2d8c4", wood: "#d8cdb0", accent: "#8a6a47", svg: ({ wood, accent }) => `
    ${shadow(400, 150)}<rect x="290" y="260" width="220" height="230" rx="8" fill="${wood}" stroke="${accent}" stroke-width="4"/><rect x="290" y="260" width="220" height="40" fill="${accent}" opacity=".5"/><rect x="370" y="330" width="60" height="18" rx="6" fill="${accent}"/>` },
};

async function main() {
fs.mkdirSync("public/seed", { recursive: true });
for (const [name, it] of Object.entries(items)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${it.bg}"/>${floor(it.floor)}${it.svg({ wood: it.wood, accent: it.accent })}</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(`public/seed/${name}.jpg`);
}
console.log("wrote", Object.keys(items).length, "images");
}
main();
