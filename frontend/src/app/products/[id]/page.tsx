"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { API_URL } from "@/lib/api";
import { useLang, useT } from "@/lib/i18n";
import { addToCart } from "@/lib/cart";
import { formatUZS } from "@/lib/currency";
import { localizedDesc, localizedName } from "@/lib/localized";
import { ProductGallery } from "@/features/catalog/ProductGallery";
import type { CatalogCategory, CatalogProduct } from "@/features/catalog/types";
import "./product.css";

export default function ProductDetailPage() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	const { lang } = useLang();
	const t = useT();

	const [product, setProduct] = useState<CatalogProduct | null>(null);
	const [categories, setCategories] = useState<CatalogCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [qty, setQty] = useState(1);
	const [toast, setToast] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		setNotFound(false);
		fetch(`${API_URL}/products/${id}`)
			.then((r) => {
				if (!r.ok) throw new Error("not found");
				return r.json();
			})
			.then((d: CatalogProduct) => setProduct(d))
			.catch(() => setNotFound(true))
			.finally(() => setLoading(false));
	}, [id]);

	// Categories — to resolve the human-readable name of each `type` slug.
	useEffect(() => {
		fetch(`${API_URL}/categories`)
			.then((r) => r.json())
			.then((c) => setCategories(Array.isArray(c) ? c : []))
			.catch(() => {});
	}, []);

	function flash(msg: string) {
		setToast(msg);
		setTimeout(() => setToast(null), 1800);
	}

	function handleAddToCart() {
		if (!product) return;
		addToCart(
			{
				productId: product.id,
				nameUz: product.nameUz,
				nameRu: product.nameRu,
				nameEn: product.nameEn,
				image: product.image,
				sellPrice: product.sellPrice,
			},
			qty,
		);
		flash(t("pd_added"));
	}

	function handleShare() {
		const url = typeof window !== "undefined" ? window.location.href : "";
		if (navigator.share) {
			navigator.share({ url }).catch(() => {});
		} else {
			navigator.clipboard?.writeText(url).then(() => flash(t("pd_link_copied"))).catch(() => {});
		}
	}

	const gallery: string[] = product
		? product.images && product.images.length > 0
			? product.images
			: product.image
				? [product.image]
				: []
		: [];

	const desc = product ? localizedDesc(product, lang) : "";

	const productCategories = product
		? categories.filter((c) => product.types?.includes(c.slug))
		: [];

	return (
		<>
			<Navbar />

			<main className="pdp">
				{loading ? (
					<p className="pdp-status">{t("prod_loading")}</p>
				) : notFound || !product ? (
					<div className="pdp-status">
						<p>{t("pd_not_found")}</p>
						<Link href="/products" className="pdp-back-link">← {t("pd_back")}</Link>
					</div>
				) : (
					<>
						<div className="pdp-breadcrumbs">
							<Link href="/products">{t("prod_all_products")}</Link>
							<span>/</span>
							<span className="pdp-crumb-current">{localizedName(product, lang)}</span>
						</div>

						<div className="pdp-grid">
							{/* Left: gallery */}
							<ProductGallery images={gallery} alt={localizedName(product, lang)} />

							{/* Right: info + buy box */}
							<div className="pdp-info">
								<h1 className="pdp-title">{localizedName(product, lang)}</h1>

								{productCategories.length > 0 && (
									<div className="pdp-tags">
										{productCategories.map((c) => (
											<Link key={c.id} href={`/products?type=${c.slug}`} className="pdp-tag">
												{localizedName(c, lang)}
											</Link>
										))}
									</div>
								)}

								<div className="pdp-buybox">
									{product.sellPrice > 0 && (
										<p className="pdp-price">{formatUZS(product.sellPrice)}</p>
									)}

									<div className="pdp-qty-row">
										<span className="pdp-qty-label">{t("pd_qty")}</span>
										<div className="pdp-qty">
											<button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-">−</button>
											<input
												type="number"
												min={1}
												value={qty}
												onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
											/>
											<button type="button" onClick={() => setQty((q) => q + 1)} aria-label="+">+</button>
										</div>
									</div>

									<div className="pdp-actions">
										<button className="pdp-btn-cart" onClick={handleAddToCart}>
											{t("prod_add_cart")}
										</button>
										<button className="pdp-btn-share" onClick={handleShare} aria-label={t("pd_share")}>
											⤴
										</button>
									</div>

									<ul className="pdp-perks">
										<li>🚚 {t("pd_delivery")}</li>
										<li>✅ {t("pd_guarantee")}</li>
										<li>↩ {t("pd_return")}</li>
									</ul>

									{product.owner?.name && (
										<div className="pdp-seller">
											<span>{t("pd_seller")}:</span> <strong>{product.owner.name}</strong>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Description block */}
						<section className="pdp-desc-block">
							<h2>{t("pd_description")}</h2>
							<p className={desc ? "" : "pdp-desc-empty"}>{desc || t("pd_no_desc")}</p>
						</section>
					</>
				)}
			</main>

			{toast && <div className="pdp-toast">{toast}</div>}
		</>
	);
}
