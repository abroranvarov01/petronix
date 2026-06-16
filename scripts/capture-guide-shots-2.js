// Extra screenshots for the user guide: register, login, dealer cabinet, catalog search.
// Usage: node scripts/capture-guide-shots-2.js
const { chromium } = require("../frontend/node_modules/playwright-core");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  // 7. REGISTER page
  await page.goto(BASE + "/register", { waitUntil: "networkidle" });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, "07-register.png") });
  console.log("07 register");

  // 8. LOGIN page
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await sleep(1000);
  await page.screenshot({ path: path.join(OUT, "08-login.png") });
  console.log("08 login");

  // 9. DEALER cabinet — log in as a dealer, open /admin
  await page.evaluate(async () => {
    const r = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "diller@test.local", password: "diller123" }),
    });
    const d = await r.json();
    localStorage.setItem("token", d.token);
    localStorage.setItem("user", JSON.stringify(d.user));
  });
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT, "09-dealer-cabinet.png") });
  console.log("09 dealer");

  // 10. CATALOG search — type a query as a customer
  await page.goto(BASE + "/products", { waitUntil: "networkidle" });
  await sleep(1500);
  await page.fill(".catalog-search-input", "reduktor");
  await sleep(800);
  await page.screenshot({ path: path.join(OUT, "10-catalog-search.png") });
  console.log("10 search");

  await browser.close();
  console.log("DONE ->", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
