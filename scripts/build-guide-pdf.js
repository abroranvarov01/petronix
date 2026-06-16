// Builds a PDF from docs/РУКОВОДСТВО.md (with embedded screenshots) using system Chrome.
// Usage: node scripts/build-guide-pdf.js
const { marked } = require("../frontend/node_modules/marked");
const { chromium } = require("../frontend/node_modules/playwright-core");
const path = require("path");
const fs = require("fs");

const DOCS = path.join(__dirname, "..", "docs");
const MD = path.join(DOCS, "РУКОВОДСТВО.md");
const HTML = path.join(DOCS, "guide.html");
const PDF = path.join(DOCS, "Petronix-Руководство.pdf");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const body = marked.parse(fs.readFileSync(MD, "utf8"));

const css = `
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1e293b; line-height: 1.6; font-size: 13px; margin: 0; }
  h1 { font-size: 26px; color: #0f172a; border-bottom: 3px solid #16a34a; padding-bottom: 10px; margin: 0 0 18px; }
  h2 { font-size: 19px; color: #15803d; margin: 26px 0 10px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
  h3 { font-size: 15px; color: #0f172a; margin: 18px 0 6px; }
  p { margin: 8px 0; }
  a { color: #16a34a; text-decoration: none; }
  ul { margin: 8px 0; padding-left: 20px; }
  li { margin: 4px 0; }
  blockquote { margin: 12px 0; padding: 8px 14px; background: #f0fdf4; border-left: 4px solid #16a34a; color: #334155; border-radius: 0 6px 6px 0; }
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-family: "Consolas", monospace; font-size: 12px; color: #be123c; }
  img { max-width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 8px; margin: 10px 0 16px; display: block; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
  th { background: #16a34a; color: #fff; }
  tr:nth-child(even) td { background: #f8fafc; }
  h2, h3 { break-after: avoid; }
  img { break-inside: avoid; }
  blockquote, table { break-inside: avoid; }
`;

const doc = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
fs.writeFileSync(HTML, doc, "utf8");

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.goto("file:///" + HTML.replace(/\\/g, "/"), { waitUntil: "networkidle" });
  await page.pdf({
    path: PDF,
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
  });
  await browser.close();
  console.log("PDF ->", PDF);
})().catch((e) => { console.error(e); process.exit(1); });
