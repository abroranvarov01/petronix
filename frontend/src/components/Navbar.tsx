"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";
import { cartCount } from "@/lib/cart";
import "./Navbar.css";

export function Navbar() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [count, setCount] = useState(0);
	const t = useT();

	useEffect(() => {
		const update = () => setCount(cartCount());
		update();
		window.addEventListener("cart-changed", update);
		window.addEventListener("storage", update);
		return () => {
			window.removeEventListener("cart-changed", update);
			window.removeEventListener("storage", update);
		};
	}, []);

	return (
		<nav className="navbar">
			<Link href="/" className="brand">
				<img src="/img/logo.png" alt="Logo" />
				<div className="brand-text">
					<span className="brand-name">Petronix</span>
					<span className="brand-sub">Technologies</span>
				</div>
			</Link>

			<div className={`nav-right ${isMenuOpen ? "active" : ""}`}>
				<Link href="/products">{t("nav_products")}</Link>
				<Link href="/#about">{t("nav_about")}</Link>
				<Link href="/#contacts">{t("nav_contacts")}</Link>
				<a href="tel:+998980113344" className="nav-btn">
					📞 {t("nav_call")}
				</a>
			</div>

			<Link href="/cart" className="nav-cart" aria-label={t("nav_cart")}>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
					<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
				</svg>
				{count > 0 && <span className="nav-cart-badge">{count}</span>}
			</Link>

			<LangSwitcher />

			<div
				className={`burger ${isMenuOpen ? "active" : ""}`}
				onClick={() => setIsMenuOpen((v) => !v)}
			>
				<span />
				<span />
				<span />
			</div>
		</nav>
	);
}
