// Captures screenshots for the user guide using the system Chrome via playwright-core.
// Usage: node scripts/capture-guide-shots.js
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

  // --- login & store token ---
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    const r = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "e2e-admin@test.local", password: "e2e12345" }),
    });
    const d = await r.json();
    localStorage.setItem("token", d.token);
    localStorage.setItem("user", JSON.stringify(d.user));
  });

  // 1. HOME — carousel
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await sleep(2500);
  await page.evaluate(() => { try { document.querySelector(".cat-swiper").swiper.autoplay.stop(); } catch (e) {} });
  await page.evaluate(() => { const el = document.querySelector(".cat-banner"); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90); });
  await sleep(800);
  await page.screenshot({ path: path.join(OUT, "01-home-carousel.png") });
  console.log("01 carousel");

  // 2. LANG switcher dropdown
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await page.click(".lang-sw-btn");
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, "02-lang-switcher.png") });
  console.log("02 lang");

  // 3. CATALOG — nested subcategories
  await page.goto(BASE + "/products?type=klapanlar", { waitUntil: "networkidle" });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT, "03-catalog-subcategories.png") });
  console.log("03 catalog");

  // 4. ADMIN — Karusel tab
  await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
  await sleep(2000);
  await page.evaluate(() => { const b = [...document.querySelectorAll(".adm-nav-item")].find(x => x.textContent.includes("Karusel")); if (b) b.click(); });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, "04-admin-karusel.png") });
  console.log("04 karusel");

  // 5. ADMIN — Kategoriyalar (subcategory management)
  await page.evaluate(() => { const b = [...document.querySelectorAll(".adm-nav-item")].find(x => x.textContent.includes("Kategoriyalar")); if (b) b.click(); });
  await sleep(900);
  await page.screenshot({ path: path.join(OUT, "05-admin-subcategories.png") });
  console.log("05 subcategories");

  // 6. ADMIN — product form with subtype select
  await page.evaluate(() => { const b = [...document.querySelectorAll(".adm-nav-item")].find(x => x.textContent.includes("Mahsulotlar")); if (b) b.click(); });
  await sleep(700);
  await page.click(".adm-btn-add");
  await sleep(600);
  await page.evaluate(() => {
    const sel = document.querySelector(".adm-form select");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    setter.call(sel, "klapanlar");
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, "06-admin-product-subtype.png") });
  console.log("06 product form");

  await browser.close();
  console.log("DONE ->", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
