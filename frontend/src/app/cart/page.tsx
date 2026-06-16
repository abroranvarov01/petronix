"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { API_URL, imgUrl } from "@/lib/api";
import { useLang, useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { getCart, setQty, removeFromCart, clearCart, cartTotal, type CartItem } from "@/lib/cart";
import { formatUZS } from "@/lib/currency";
import "./cart.css";

function name(i: CartItem, lang: Lang): string {
	if (lang === "ru" && i.nameRu) return i.nameRu;
	if (lang === "en" && i.nameEn) return i.nameEn;
	return i.nameUz || i.nameRu || i.nameEn || "";
}

export default function CartPage() {
	const t = useT();
	const { lang } = useLang();
	const [items, setItems] = useState<CartItem[]>([]);
	const [total, setTotal] = useState(0);
	const [form, setForm] = useState({ customerName: "", customerPhone: "", address: "", comment: "" });
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState<string | null>(null);

	function refresh() {
		setItems(getCart());
		setTotal(cartTotal());
	}

	useEffect(() => {
		refresh();
		const h = () => refresh();
		window.addEventListener("cart-changed", h);
		return () => window.removeEventListener("cart-changed", h);
	}, []);

	async function checkout(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const res = await fetch(`${API_URL}/orders`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...form,
					items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
				}),
			});
			const data = await res.json();
			if (!res.ok) { setError(data.message ?? "Xatolik"); return; }
			clearCart();
			setDone(data.id);
		} catch { setError("Server xatosi"); }
		finally { setSubmitting(false); }
	}

	return (
		<>
			<Navbar />
			<div className="cart-page">
				<h1 className="cart-h1">{t("cart_title")}</h1>

				{done ? (
					<div className="cart-success">
						<div className="cart-success-icon">✓</div>
						<h2>{t("co_success")}</h2>
						<p>{t("co_success_sub")}</p>
						<p className="cart-order-id">#{done.slice(-8)}</p>
						<Link href="/products" className="cart-checkout-btn">{t("cart_continue")}</Link>
					</div>
				) : items.length === 0 ? (
					<div className="cart-empty">
						<p>{t("cart_empty")}</p>
						<Link href="/products" className="cart-checkout-btn">{t("cart_continue")}</Link>
					</div>
				) : (
					<div className="cart-grid">
						{/* Items */}
						<div className="cart-items">
							{items.map((i) => (
								<div key={i.productId} className="cart-row">
									<div className="cart-thumb">
										{i.image ? <img src={imgUrl(i.image)} alt="" /> : <div className="cart-thumb-ph" />}
									</div>
									<div className="cart-row-info">
										<div className="cart-row-name">{name(i, lang)}</div>
										<div className="cart-row-price">{formatUZS(i.sellPrice)}</div>
									</div>
									<div className="cart-qty">
										<button onClick={() => setQty(i.productId, i.qty - 1)}>−</button>
										<span>{i.qty}</span>
										<button onClick={() => setQty(i.productId, i.qty + 1)}>+</button>
									</div>
									<div className="cart-row-sub">{formatUZS(i.sellPrice * i.qty)}</div>
									<button className="cart-remove" onClick={() => removeFromCart(i.productId)} title={t("cart_remove")}>✕</button>
								</div>
							))}
						</div>

						{/* Checkout */}
						<form className="cart-checkout" onSubmit={checkout}>
							<div className="cart-total-row">
								<span>{t("cart_total")}</span>
								<strong>{formatUZS(total)}</strong>
							</div>
							<input className="cart-input" placeholder={t("co_name")} required
								value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} />
							<input className="cart-input" placeholder={t("co_phone")} required
								value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} />
							<input className="cart-input" placeholder={t("co_address")}
								value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
							<textarea className="cart-input" placeholder={t("co_comment")} rows={2}
								value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} />
							{error && <div className="cart-error">{error}</div>}
							<button type="submit" className="cart-checkout-btn" disabled={submitting}>
								{submitting ? "..." : t("co_submit")}
							</button>
						</form>
					</div>
				)}
			</div>
		</>
	);
}
