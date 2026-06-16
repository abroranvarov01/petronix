// New screens for the updated guide: cart, admin orders, warehouse, reports.
// Usage: node scripts/capture-guide-shots-3.js  (needs backend :3001 + frontend :3000)
const { chromium } = require("../frontend/node_modules/playwright-core");
const path = require("path");

const FRONT = "http://localhost:3000";
const API = "http://localhost:3001/api";
const OUT = path.join(__dirname, "..", "docs", "screenshots");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ADMIN = { email: "guide@petronix.uz", password: "guide12345" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(token, method, p, body) {
  const res = await fetch(API + p, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json().catch(() => ({}));
}

(async () => {
  // ---- demo data ----
  const token = (await api(null, "POST", "/auth/login", ADMIN)).token;
  await api(token, "POST", "/categories", { nameUz: "Klapanlar", nameRu: "Клапаны", nameEn: "Valves", slug: "guide-klap" });
  const p1 = await api(token, "POST", "/products", { nameUz: "Reduktor R200", nameRu: "Редуктор R200", nameEn: "Reducer R200", type: "guide-klap", sellPrice: 120, costPrice: 70, brand: ["Petronix"], image: "/uploads/1775022595249-ghtvwla8dgi.jpg" });
  const p2 = await api(token, "POST", "/products", { nameUz: "Klapan K20", nameRu: "Клапан K20", nameEn: "Valve K20", type: "guide-klap", sellPrice: 45, costPrice: 20, brand: ["Petronix"], image: "/uploads/1776157125836-hlpdtgk4ctr.jpg" });
  // supplier + receipt (stock)
  const sup = await api(token, "POST", "/suppliers", { name: "GazPart LLC", phone: "+998901234567" });
  const supply = await api(token, "POST", "/supplies", { supplierId: sup.id, items: [{ productId: p1.id, qty: 25, unitCost: 70 }, { productId: p2.id, qty: 40, unitCost: 20 }] });
  await api(token, "POST", `/supplies/${supply.id}/post`);
  // a paid order (for orders + reports)
  const order = await api(null, "POST", "/orders", { customerName: "Aziz Karimov", customerPhone: "+998901112233", address: "Tashkent, Chilonzor", items: [{ productId: p1.id, qty: 2 }, { productId: p2.id, qty: 3 }] });
  await api(token, "POST", `/payments/${order.id}/confirm`);
  await api(null, "POST", "/orders", { customerName: "Dilshod", customerPhone: "+998907778899", items: [{ productId: p2.id, qty: 1 }] });

  // ---- screenshots ----
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  // 11. CART (client) — seed localStorage cart, open /cart
  await page.goto(FRONT + "/products", { waitUntil: "networkidle" });
  await page.evaluate(({ p1, p2 }) => {
    const cart = [
      { productId: p1.id, nameUz: "Reduktor R200", nameRu: "Редуктор R200", nameEn: "Reducer R200", image: p1.image, sellPrice: 120, qty: 2 },
      { productId: p2.id, nameUz: "Klapan K20", nameRu: "Клапан K20", nameEn: "Valve K20", image: p2.image, sellPrice: 45, qty: 3 },
    ];
    localStorage.setItem("cart", JSON.stringify(cart));
  }, { p1, p2 });
  await page.goto(FRONT + "/cart", { waitUntil: "networkidle" });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, "11-cart.png") });
  console.log("11 cart");

  // login as admin in the browser
  await page.evaluate(async (ADMIN) => {
    const r = await fetch("http://localhost:3001/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ADMIN) });
    const d = await r.json();
    localStorage.setItem("token", d.token);
    localStorage.setItem("user", JSON.stringify(d.user));
  }, ADMIN);

  const openTab = async (label) => {
    await page.evaluate((l) => { const b = [...document.querySelectorAll(".adm-nav-item")].find((x) => x.textContent.includes(l)); if (b) b.click(); }, label);
    await sleep(1200);
  };

  await page.goto(FRONT + "/admin", { waitUntil: "networkidle" });
  await sleep(1500);

  // 12. ORDERS — expand first order for detail
  await openTab("Buyurtmalar");
  await page.evaluate(() => { const b = document.querySelector(".adm-table tbody tr td:last-child .adm-link-btn"); if (b) b.click(); });
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, "12-admin-orders.png") });
  console.log("12 orders");

  // 13. WAREHOUSE
  await openTab("Ombor");
  await page.screenshot({ path: path.join(OUT, "13-admin-warehouse.png") });
  console.log("13 warehouse");

  // 14. REPORTS (profit gives nice numbers)
  await openTab("Hisobotlar");
  await page.evaluate(() => { const b = [...document.querySelectorAll(".adm-rep-tab")].find((x) => x.textContent.includes("Foyda")); if (b) b.click(); });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, "14-admin-reports.png") });
  console.log("14 reports");

  await browser.close();
  console.log("DONE ->", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
