"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { API_URL, imgUrl } from "@/lib/api";
import { useLang, useT } from "@/lib/i18n";
import { addToCart } from "@/lib/cart";
import { formatUZS } from "@/lib/currency";
import "./products.css";
import type { Lang } from "@/lib/i18n";

/* ========================= TYPES ========================= */

interface Product {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	descriptionUz: string;
	descriptionRu: string;
	descriptionEn: string;
	image: string;
	brand: string[];
	type: string;
	subtypes: string[];
	sellPrice: number;
	owner?: { id: string; name: string };
}

interface Subcategory {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	name: string;
	slug: string;
}

interface Category {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	name: string;
	slug: string;
	subcategories?: Subcategory[];
}

function getCatName(cat: Category | Subcategory, lang: Lang): string {
	if (lang === "ru" && cat.nameRu) return cat.nameRu;
	if (lang === "en" && cat.nameEn) return cat.nameEn;
	return cat.nameUz || cat.nameRu || cat.nameEn || cat.name || "";
}

/* ========================= HELPERS ========================= */

function getName(p: Product, lang: Lang): string {
	if (lang === "ru" && p.nameRu) return p.nameRu;
	if (lang === "en" && p.nameEn) return p.nameEn;
	return p.nameUz || p.nameRu || p.nameEn || "";
}

function getDesc(p: Product, lang: Lang): string {
	if (lang === "ru" && p.descriptionRu) return p.descriptionRu;
	if (lang === "en" && p.descriptionEn) return p.descriptionEn;
	return p.descriptionUz || p.descriptionRu || p.descriptionEn || "";
}

/* ========================= PRODUCT CARD ========================= */

function ProductCard({ product, lang, onOrder }: {
	product: Product; lang: Lang; onOrder: () => void;
}) {
	const t = useT();
	const desc = getDesc(product, lang);

	return (
		<div className="pcard">
			<div className="pcard-img-wrap">
				{product.image ? (
					<img src={imgUrl(product.image)} alt={getName(product, lang)} className="pcard-img" />
				) : (
					<div className="pcard-img-placeholder" />
				)}
			</div>
			<div className="pcard-body">
				<h4 className="pcard-name">{getName(product, lang)}</h4>
				{product.sellPrice > 0 && (
					<p className="pcard-price">{formatUZS(product.sellPrice)}</p>
				)}
				{desc && <p className="pcard-desc">{desc}</p>}
				<div className="pcard-actions">
					<button className="pcard-buy" onClick={onOrder}>{t("prod_add_cart")}</button>
					<button className="pcard-details">{t("prod_details") || "Подробнее"}</button>
				</div>
			</div>
		</div>
	);
}

/* ========================= CATALOG PAGE ========================= */

export default function CatalogPageWrapper() {
	return (
		<Suspense fallback={<><Navbar /><div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b" }}>...</div></>}>
			<CatalogPage />
		</Suspense>
	);
}

function CatalogPage() {
	const searchParams = useSearchParams();
	const { lang } = useLang();
	const t = useT();

	const PAGE_SIZE = 24;

	const [items, setItems] = useState<Product[]>([]);
	const [total, setTotal] = useState(0);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);

	const [selectedType, setSelectedType] = useState<string | null>(searchParams.get("type"));
	// Multi-select subcategory filter (tags). Accumulates; a second click removes.
	const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>(() => {
		const s = searchParams.get("subtype");
		return s ? s.split(",").filter(Boolean) : [];
	});
	// Which categories have their subcategory list expanded. Independent of the
	// active filter, so opening one category does not collapse the others.
	const [expandedCats, setExpandedCats] = useState<Set<string>>(() => {
		const t = searchParams.get("type");
		return t ? new Set([t]) : new Set();
	});
	const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
	const [search, setSearch] = useState(searchInput.trim());

	// Categories (sidebar) — loaded once.
	useEffect(() => {
		fetch(`${API_URL}/categories`)
			.then((r) => r.json())
			.then((cats) => setCategories(Array.isArray(cats) ? cats : []))
			.catch(() => {});
	}, []);

	// Sync filters from the URL (e.g. when arriving from a banner link).
	useEffect(() => {
		setSelectedType(searchParams.get("type"));
		const s = searchParams.get("subtype");
		setSelectedSubtypes(s ? s.split(",").filter(Boolean) : []);
		setSearchInput(searchParams.get("q") || "");
	}, [searchParams]);

	// Debounce the search box so we don't hit the API on every keystroke.
	useEffect(() => {
		const id = setTimeout(() => setSearch(searchInput.trim()), 350);
		return () => clearTimeout(id);
	}, [searchInput]);

	function buildQuery(page: number) {
		const p = new URLSearchParams();
		if (selectedType) p.set("type", selectedType);
		if (selectedSubtypes.length) p.set("subtype", selectedSubtypes.join(","));
		if (search) p.set("q", search);
		p.set("page", String(page));
		p.set("limit", String(PAGE_SIZE));
		return p.toString();
	}

	// Fetch page 1 whenever filters/search change (server-side filtering).
	useEffect(() => {
		setLoading(true);
		fetch(`${API_URL}/products?${buildQuery(1)}`)
			.then((r) => r.json())
			.then((d) => { setItems(d.items ?? []); setTotal(d.total ?? 0); })
			.catch(() => { setItems([]); setTotal(0); })
			.finally(() => setLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedType, selectedSubtypes.join(","), search]);

	function loadMore() {
		const nextPage = Math.floor(items.length / PAGE_SIZE) + 1;
		setLoadingMore(true);
		fetch(`${API_URL}/products?${buildQuery(nextPage)}`)
			.then((r) => r.json())
			.then((d) => setItems((prev) => [...prev, ...(d.items ?? [])]))
			.catch(() => {})
			.finally(() => setLoadingMore(false));
	}

	const activeCategory = categories.find((c) => c.slug === selectedType);
	const activeSubcategory =
		selectedSubtypes.length === 1
			? activeCategory?.subcategories?.find((s) => s.slug === selectedSubtypes[0])
			: undefined;

	function selectCategory(slug: string | null) {
		setSelectedType(slug);
		setSelectedSubtypes([]);
		if (slug === null) return;
		// Toggle only this category's expansion; others stay as they were.
		setExpandedCats((prev) => {
			const next = new Set(prev);
			if (next.has(slug)) next.delete(slug);
			else next.add(slug);
			return next;
		});
	}

	const handleOrder = (product: Product) => {
		addToCart({
			productId: product.id,
			nameUz: product.nameUz,
			nameRu: product.nameRu,
			nameEn: product.nameEn,
			image: product.image,
			sellPrice: product.sellPrice,
		});
	};

	return (
		<>
			<Navbar />

			<div className="catalog-page">
				{/* Left: category list */}
				<aside className="catalog-aside">
					<h3 className="catalog-aside-title">{t("prod_categories")}</h3>
					<button
						className={`cat-link${!selectedType ? " active" : ""}`}
						onClick={() => selectCategory(null)}
					>
						{t("prod_all")}
					</button>
					{categories.map((cat) => {
						const isActive = selectedType === cat.slug;
						const isExpanded = expandedCats.has(cat.slug);
						const subs = cat.subcategories ?? [];
						return (
							<div key={cat.id} className="cat-group">
								<button
									className={`cat-link${isActive ? " active" : ""}${isExpanded ? " expanded" : ""}`}
									onClick={() => selectCategory(cat.slug)}
								>
									<span className="cat-link-label">{getCatName(cat, lang)}</span>
									{subs.length > 0 && (
										<svg className="cat-link-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
									)}
								</button>
								{isExpanded && subs.length > 0 && (
									<div className="cat-sublist">
										{subs.map((sub) => (
											<button
												key={sub.id}
												className={`cat-sublink${selectedSubtypes.includes(sub.slug) ? " active" : ""}`}
												onClick={() =>
													setSelectedSubtypes((prev) =>
														prev.includes(sub.slug)
															? prev.filter((x) => x !== sub.slug)
															: [...prev, sub.slug],
													)
												}
											>
												{getCatName(sub, lang)}
											</button>
										))}
									</div>
								)}
							</div>
						);
					})}
				</aside>

				{/* Right: products */}
				<main className="catalog-main">
					<div className="catalog-toprow">
						<h2 className="catalog-heading">
							{activeSubcategory
								? getCatName(activeSubcategory, lang)
								: activeCategory
									? getCatName(activeCategory, lang)
									: t("prod_all_products")}
						</h2>
					</div>

					{/* Search */}
					<div className="catalog-search-row">
						<input
							type="text"
							className="catalog-search-input"
							placeholder={t("prod_search")}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>

					{/* Grid */}
					<div className="catalog-grid">
						{loading ? (
							<p className="catalog-status">{t("prod_loading")}</p>
						) : items.length === 0 ? (
							<p className="catalog-status">{t("prod_empty")}</p>
						) : (
							items.map((p) => (
								<ProductCard
									key={p.id}
									product={p}
									lang={lang}
									onOrder={() => handleOrder(p)}
								/>
							))
						)}
					</div>

					{!loading && items.length < total && (
						<div className="catalog-loadmore-row">
							<button className="catalog-loadmore" onClick={loadMore} disabled={loadingMore}>
								{loadingMore ? t("prod_loading") : t("prod_load_more")}
							</button>
							<span className="catalog-count">{items.length} / {total}</span>
						</div>
					)}
				</main>
			</div>
		</>
	);
}
