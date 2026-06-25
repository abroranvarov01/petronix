"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";
import { cartCount } from "@/lib/cart";
import { getUser, logout } from "@/lib/auth";
import "./Navbar.css";

export function Navbar() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [count, setCount] = useState(0);
	const [loggedIn, setLoggedIn] = useState(false);
	const t = useT();
	const router = useRouter();

	useEffect(() => {
		const update = () => setCount(cartCount());
		const updateAuth = () => setLoggedIn(!!getUser());
		update();
		updateAuth();
		window.addEventListener("cart-changed", update);
		window.addEventListener("storage", update);
		window.addEventListener("storage", updateAuth);
		window.addEventListener("auth-changed", updateAuth);
		return () => {
			window.removeEventListener("cart-changed", update);
			window.removeEventListener("storage", update);
			window.removeEventListener("storage", updateAuth);
			window.removeEventListener("auth-changed", updateAuth);
		};
	}, []);

	const handleLogout = () => {
		logout();
		setLoggedIn(false);
		window.dispatchEvent(new Event("auth-changed"));
		router.push("/");
	};

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

			{loggedIn ? (
				<div className="nav-auth">
					<Link href="/admin" className="nav-auth-link" aria-label={t("nav_account")}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
						</svg>
						<span className="nav-auth-text">{t("nav_account")}</span>
					</Link>
					<button type="button" className="nav-auth-logout" onClick={handleLogout} aria-label={t("nav_logout")}>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
						</svg>
					</button>
				</div>
			) : (
				<Link href="/login" className="nav-auth-btn">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
					</svg>
					<span className="nav-auth-text">{t("nav_login")}</span>
				</Link>
			)}

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
