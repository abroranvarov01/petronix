// Client-side cart (localStorage). Checkout sends items to POST /orders.
// A "cart-changed" window event lets the navbar badge / cart page react live.

export interface CartItem {
  productId: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  image: string;
  sellPrice: number;
  qty: number;
}

const KEY = "cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-changed"));
}

export function getCart(): CartItem[] {
  return read();
}

export function cartCount(): number {
  return read().reduce((s, i) => s + i.qty, 0);
}

export function cartTotal(): number {
  return read().reduce((s, i) => s + i.sellPrice * i.qty, 0);
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  const items = read();
  const found = items.find((i) => i.productId === item.productId);
  if (found) found.qty += qty;
  else items.push({ ...item, qty });
  write(items);
}

export function setQty(productId: string, qty: number) {
  let items = read();
  if (qty <= 0) {
    items = items.filter((i) => i.productId !== productId);
  } else {
    const found = items.find((i) => i.productId === productId);
    if (found) found.qty = qty;
  }
  write(items);
}

export function removeFromCart(productId: string) {
  write(read().filter((i) => i.productId !== productId));
}

export function clearCart() {
  write([]);
}
