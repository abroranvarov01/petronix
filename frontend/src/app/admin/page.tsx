"use client";

import { useState, useEffect, Fragment, FormEvent } from "react";
import { useRouter } from "next/navigation";
import "./admin.css";
import ImageUpload from "@/components/ImageUpload";
import { API_URL, imgUrl } from "@/lib/api";
import { getToken, getUser, authHeaders, logout } from "@/lib/auth";

interface Product {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	descriptionUz: string;
	descriptionRu: string;
	descriptionEn: string;
	brand: string[];
	type: string;
	subtype: string;
	image: string;
	costPrice: number;
	sellPrice: number;
	wholesalePrice: number;
	ownerId?: string;
	owner?: { id: string; name: string };
}

interface Subcategory {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	name: string;
	slug: string;
	image: string;
	order: number;
	categoryId: string;
}

interface Banner {
	id: string;
	image: string;
	link: string;
	order: number;
}

interface OrderItem {
	id: string;
	productId: string;
	sellerId?: string | null;
	nameSnapshot: string;
	qty: number;
	unitPrice: number;
	subtotal: number;
}

interface Payment {
	id: string;
	status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
	amount: number;
	method: string;
}

interface Order {
	id: string;
	status: "NEW" | "CONFIRMED" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";
	customerName: string;
	customerPhone: string;
	address: string;
	comment: string;
	total: number;
	items: OrderItem[];
	payment?: Payment | null;
	createdAt: string;
}

interface StockRow {
	id: string;
	productId: string;
	quantity: number;
	minQuantity: number;
	product: { id: string; nameUz: string; nameRu: string; nameEn: string; unit: string; costPrice: number; ownerId?: string };
	warehouse: { id: string; name: string };
}

interface Movement {
	id: string;
	type: "RECEIPT" | "SALE" | "WRITE_OFF" | "TRANSFER_IN" | "TRANSFER_OUT" | "ADJUSTMENT";
	qty: number;
	unitCost: number;
	reason: string;
	createdAt: string;
	product: { nameUz: string; nameRu: string; nameEn: string };
}

interface Supplier {
	id: string;
	name: string;
	phone: string;
	note: string;
}

const MOVEMENT_LABEL: Record<string, string> = {
	RECEIPT: "Kirim", SALE: "Sotuv", WRITE_OFF: "Hisobdan chiqarish",
	TRANSFER_IN: "Ko'chirish (+)", TRANSFER_OUT: "Ko'chirish (−)", ADJUSTMENT: "Tuzatish",
};

const ORDER_STATUSES = ["NEW", "CONFIRMED", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"] as const;
const ORDER_STATUS_LABEL: Record<string, string> = {
	NEW: "Yangi", CONFIRMED: "Tasdiqlangan", PAID: "To'langan",
	SHIPPED: "Jo'natilgan", COMPLETED: "Bajarilgan", CANCELLED: "Bekor qilingan",
};

interface Category {
	id: string;
	nameUz: string;
	nameRu: string;
	nameEn: string;
	name: string;
	slug: string;
	image: string;
	order: number;
	subcategories?: Subcategory[];
}

const EMPTY_PRODUCT = {
	nameUz: "", nameRu: "", nameEn: "",
	descriptionUz: "", descriptionRu: "", descriptionEn: "",
	brand: [] as string[],
	type: "",
	subtype: "",
	image: "",
	costPrice: 0,
	sellPrice: 0,
	wholesalePrice: 0,
};

const EMPTY_CATEGORY = { nameUz: "", nameRu: "", nameEn: "", name: "", slug: "", image: "", order: 0 };
const EMPTY_SUBCATEGORY = { nameUz: "", nameRu: "", nameEn: "", name: "", slug: "", image: "", order: 0, categoryId: "" };

type Lang = "uz" | "ru" | "en";
const LANGS: { key: Lang; label: string; flag: string }[] = [
	{ key: "uz", label: "O'zbek", flag: "🇺🇿" },
	{ key: "ru", label: "Русский", flag: "🇷🇺" },
	{ key: "en", label: "English", flag: "🇬🇧" },
];

export default function AdminPage() {
	const router = useRouter();
	const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
	const [activeTab, setActiveTab] = useState<"products" | "orders" | "warehouse" | "reports" | "categories" | "banners">("products");
	const [activeLang, setActiveLang] = useState<Lang>("uz");
	const [showForm, setShowForm] = useState(false);

	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [form, setForm] = useState(EMPTY_PRODUCT);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const [catForm, setCatForm] = useState(EMPTY_CATEGORY);
	const [editingCatId, setEditingCatId] = useState<string | null>(null);
	const [catSubmitting, setCatSubmitting] = useState(false);
	const [catError, setCatError] = useState<string | null>(null);
	const [catLoading, setCatLoading] = useState(false);
	const [showCatForm, setShowCatForm] = useState(false);

	const [subForm, setSubForm] = useState(EMPTY_SUBCATEGORY);
	const [editingSubId, setEditingSubId] = useState<string | null>(null);
	const [subSubmitting, setSubSubmitting] = useState(false);
	const [subError, setSubError] = useState<string | null>(null);
	const [showSubForm, setShowSubForm] = useState(false);

	const [banners, setBanners] = useState<Banner[]>([]);
	const [bannerLoading, setBannerLoading] = useState(false);
	const [bannerSaving, setBannerSaving] = useState(false);
	const [bannerError, setBannerError] = useState<string | null>(null);
	const [bannerUploadKey, setBannerUploadKey] = useState(0);

	const [orders, setOrders] = useState<Order[]>([]);
	const [ordersLoading, setOrdersLoading] = useState(false);
	const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

	const [stock, setStock] = useState<StockRow[]>([]);
	const [movements, setMovements] = useState<Movement[]>([]);
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [whLoading, setWhLoading] = useState(false);
	const [showSupplyForm, setShowSupplyForm] = useState(false);
	const [supplyForm, setSupplyForm] = useState<{ supplierId: string; items: { productId: string; qty: number; unitCost: number }[] }>({ supplierId: "", items: [{ productId: "", qty: 1, unitCost: 0 }] });
	const [supplySaving, setSupplySaving] = useState(false);
	const [showSupplierForm, setShowSupplierForm] = useState(false);
	const [supplierForm, setSupplierForm] = useState({ name: "", phone: "", note: "" });

	const todayStr = new Date().toISOString().slice(0, 10);
	const monthAgoStr = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
	const [reportType, setReportType] = useState<"sales" | "stock" | "profit" | "turnover">("sales");
	const [repFrom, setRepFrom] = useState(monthAgoStr);
	const [repTo, setRepTo] = useState(todayStr);
	const [turnoverBy, setTurnoverBy] = useState<"category" | "dealer">("category");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [reportData, setReportData] = useState<any>(null);
	const [reportLoading, setReportLoading] = useState(false);

	useEffect(() => {
		const token = getToken();
		const u = getUser();
		if (!token || !u) { router.push("/login"); return; }
		setUser(u);
	}, [router]);

	async function loadProducts() {
		setLoading(true);
		try {
			const res = await fetch(`${API_URL}/products/full`, { headers: authHeaders() });
			if (res.status === 401) { router.push("/login"); return; }
			setProducts(await res.json());
		} catch { setError("Yuklab bo'lmadi"); }
		finally { setLoading(false); }
	}

	async function loadCategories() {
		setCatLoading(true);
		try {
			const res = await fetch(`${API_URL}/categories`);
			setCategories(await res.json());
		} catch { setCatError("Yuklab bo'lmadi"); }
		finally { setCatLoading(false); }
	}

	async function loadBanners() {
		setBannerLoading(true);
		try {
			const res = await fetch(`${API_URL}/banners`);
			setBanners(await res.json());
		} catch { setBannerError("Yuklab bo'lmadi"); }
		finally { setBannerLoading(false); }
	}

	async function loadOrders() {
		setOrdersLoading(true);
		try {
			const res = await fetch(`${API_URL}/orders`, { headers: authHeaders() });
			if (res.status === 401) { router.push("/login"); return; }
			setOrders(await res.json());
		} catch { /* ignore */ }
		finally { setOrdersLoading(false); }
	}

	async function handleOrderStatus(id: string, status: string) {
		await fetch(`${API_URL}/orders/${id}/status`, {
			method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status }),
		});
		await loadOrders();
	}

	async function handlePaymentConfirm(orderId: string) {
		await fetch(`${API_URL}/payments/${orderId}/confirm`, { method: "POST", headers: authHeaders() });
		await loadOrders();
	}

	async function loadWarehouse() {
		setWhLoading(true);
		try {
			const [s, m] = await Promise.all([
				fetch(`${API_URL}/warehouse/stock`, { headers: authHeaders() }).then((r) => r.json()),
				fetch(`${API_URL}/warehouse/movements`, { headers: authHeaders() }).then((r) => r.json()),
			]);
			setStock(Array.isArray(s) ? s : []);
			setMovements(Array.isArray(m) ? m : []);
			if (isAdmin) {
				const sup = await fetch(`${API_URL}/suppliers`, { headers: authHeaders() }).then((r) => r.json());
				setSuppliers(Array.isArray(sup) ? sup : []);
			}
		} catch { /* ignore */ }
		finally { setWhLoading(false); }
	}

	async function handleSupplySubmit(e: FormEvent) {
		e.preventDefault();
		setSupplySaving(true);
		try {
			const items = supplyForm.items.filter((i) => i.productId && i.qty > 0);
			if (items.length === 0) { setSupplySaving(false); return; }
			const created = await fetch(`${API_URL}/supplies`, {
				method: "POST", headers: authHeaders(),
				body: JSON.stringify({ supplierId: supplyForm.supplierId || undefined, items }),
			}).then((r) => r.json());
			await fetch(`${API_URL}/supplies/${created.id}/post`, { method: "POST", headers: authHeaders() });
			setShowSupplyForm(false);
			setSupplyForm({ supplierId: "", items: [{ productId: "", qty: 1, unitCost: 0 }] });
			await loadWarehouse();
		} catch { /* ignore */ }
		finally { setSupplySaving(false); }
	}

	async function handleSupplierSubmit(e: FormEvent) {
		e.preventDefault();
		await fetch(`${API_URL}/suppliers`, { method: "POST", headers: authHeaders(), body: JSON.stringify(supplierForm) });
		setSupplierForm({ name: "", phone: "", note: "" });
		setShowSupplierForm(false);
		await loadWarehouse();
	}

	async function handleWriteOff(productId: string) {
		const qty = Number(prompt("Hisobdan chiqarish miqdori:"));
		if (!qty || qty <= 0) return;
		await fetch(`${API_URL}/warehouse/write-off`, {
			method: "POST", headers: authHeaders(),
			body: JSON.stringify({ productId, qty, reason: "Qo'lda hisobdan chiqarish" }),
		});
		await loadWarehouse();
	}

	async function handleAdjust(productId: string, current: number) {
		const v = prompt("Yangi qoldiq (aniq son):", String(current));
		if (v === null) return;
		const quantity = Number(v);
		if (Number.isNaN(quantity)) return;
		await fetch(`${API_URL}/warehouse/adjust`, {
			method: "POST", headers: authHeaders(),
			body: JSON.stringify({ productId, quantity, reason: "Qo'lda tuzatish" }),
		});
		await loadWarehouse();
	}

	async function loadReport() {
		setReportLoading(true);
		try {
			let url = "";
			if (reportType === "sales") url = `${API_URL}/reports/sales?from=${repFrom}&to=${repTo}&groupBy=day`;
			else if (reportType === "profit") url = `${API_URL}/reports/profit?from=${repFrom}&to=${repTo}`;
			else if (reportType === "turnover") url = `${API_URL}/reports/turnover?from=${repFrom}&to=${repTo}&by=${turnoverBy}`;
			else url = `${API_URL}/reports/stock`;
			const data = await fetch(url, { headers: authHeaders() }).then((r) => r.json());
			setReportData(data);
		} catch { setReportData(null); }
		finally { setReportLoading(false); }
	}

	useEffect(() => {
		if (user && activeTab === "reports") loadReport();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, activeTab, reportType, repFrom, repTo, turnoverBy]);

	function exportCsv(headers: string[], rows: (string | number)[][], filename: string) {
		const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
		const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = filename;
		a.click();
	}

	useEffect(() => {
		if (user) { loadProducts(); loadCategories(); loadBanners(); loadOrders(); loadWarehouse(); }
	}, [user]);

	async function handleBannerAdd(image: string) {
		if (!image) return;
		setBannerSaving(true);
		setBannerError(null);
		try {
			const res = await fetch(`${API_URL}/banners`, {
				method: "POST",
				headers: authHeaders(),
				body: JSON.stringify({ image, order: banners.length }),
			});
			if (res.status === 401) { router.push("/login"); return; }
			if (!res.ok) { const d = await res.json(); setBannerError(d.message ?? "Xatolik"); return; }
			await loadBanners();
		} catch { setBannerError("Server xatosi"); }
		finally { setBannerSaving(false); setBannerUploadKey((k) => k + 1); }
	}

	async function handleBannerDelete(id: string) {
		if (!confirm("Rasmni o'chirishni tasdiqlaysizmi?")) return;
		await fetch(`${API_URL}/banners/${id}`, { method: "DELETE", headers: authHeaders() });
		await loadBanners();
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const url = editingId ? `${API_URL}/products/${editingId}` : `${API_URL}/products`;
			const method = editingId ? "PATCH" : "POST";
			const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
			if (res.status === 401) { router.push("/login"); return; }
			const data = await res.json();
			if (!res.ok) { setError(data.message ?? "Xatolik"); return; }
			setForm(EMPTY_PRODUCT);
			setEditingId(null);
			setShowForm(false);
			await loadProducts();
		} catch { setError("Server xatosi"); }
		finally { setSubmitting(false); }
	}

	async function handleDelete(id: string) {
		if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
		await fetch(`${API_URL}/products/${id}`, { method: "DELETE", headers: authHeaders() });
		await loadProducts();
	}

	function startEdit(p: Product) {
		setEditingId(p.id);
		setForm({
			nameUz: p.nameUz, nameRu: p.nameRu, nameEn: p.nameEn,
			descriptionUz: p.descriptionUz, descriptionRu: p.descriptionRu, descriptionEn: p.descriptionEn,
			brand: p.brand, type: p.type, subtype: p.subtype || "", image: p.image,
			costPrice: p.costPrice, sellPrice: p.sellPrice, wholesalePrice: p.wholesalePrice,
		});
		setShowForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function cancelEdit() {
		setEditingId(null);
		setForm(EMPTY_PRODUCT);
		setShowForm(false);
	}

	async function handleCatSubmit(e: FormEvent) {
		e.preventDefault();
		setCatSubmitting(true);
		setCatError(null);
		try {
			const url = editingCatId ? `${API_URL}/categories/${editingCatId}` : `${API_URL}/categories`;
			const method = editingCatId ? "PATCH" : "POST";
			const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(catForm) });
			if (res.status === 401) { router.push("/login"); return; }
			const data = await res.json();
			if (!res.ok) { setCatError(data.message ?? "Xatolik"); return; }
			setCatForm(EMPTY_CATEGORY);
			setEditingCatId(null);
			setShowCatForm(false);
			await loadCategories();
		} catch { setCatError("Server xatosi"); }
		finally { setCatSubmitting(false); }
	}

	async function handleCatDelete(id: string) {
		if (!confirm("Kategoriyani o'chirishni tasdiqlaysizmi?")) return;
		await fetch(`${API_URL}/categories/${id}`, { method: "DELETE", headers: authHeaders() });
		await loadCategories();
	}

	function startCatEdit(cat: Category) {
		setEditingCatId(cat.id);
		setCatForm({ nameUz: cat.nameUz || "", nameRu: cat.nameRu || "", nameEn: cat.nameEn || "", name: cat.name || "", slug: cat.slug, image: cat.image, order: cat.order });
		setShowCatForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function cancelCatEdit() {
		setEditingCatId(null);
		setCatForm(EMPTY_CATEGORY);
		setShowCatForm(false);
	}

	function openNewSub(categoryId: string) {
		setEditingSubId(null);
		setSubForm({ ...EMPTY_SUBCATEGORY, categoryId });
		setSubError(null);
		setShowSubForm(true);
	}

	function startSubEdit(sub: Subcategory) {
		setEditingSubId(sub.id);
		setSubForm({
			nameUz: sub.nameUz || "", nameRu: sub.nameRu || "", nameEn: sub.nameEn || "",
			name: sub.name || "", slug: sub.slug, image: sub.image || "", order: sub.order,
			categoryId: sub.categoryId,
		});
		setSubError(null);
		setShowSubForm(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function cancelSubEdit() {
		setEditingSubId(null);
		setSubForm(EMPTY_SUBCATEGORY);
		setShowSubForm(false);
	}

	async function handleSubSubmit(e: FormEvent) {
		e.preventDefault();
		setSubSubmitting(true);
		setSubError(null);
		try {
			const url = editingSubId ? `${API_URL}/subcategories/${editingSubId}` : `${API_URL}/subcategories`;
			const method = editingSubId ? "PATCH" : "POST";
			const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(subForm) });
			if (res.status === 401) { router.push("/login"); return; }
			const data = await res.json();
			if (!res.ok) { setSubError(data.message ?? "Xatolik"); return; }
			cancelSubEdit();
			await loadCategories();
		} catch { setSubError("Server xatosi"); }
		finally { setSubSubmitting(false); }
	}

	async function handleSubDelete(id: string) {
		if (!confirm("Subkategoriyani o'chirishni tasdiqlaysizmi?")) return;
		await fetch(`${API_URL}/subcategories/${id}`, { method: "DELETE", headers: authHeaders() });
		await loadCategories();
	}

	function handleLogout() { logout(); router.push("/login"); }

	const isAdmin = user?.role === "ADMIN";
	const visibleProducts = isAdmin ? products : products.filter((p) => p.ownerId === user?.id);

	const filteredProducts = searchQuery
		? visibleProducts.filter((p) =>
			(p.nameUz + p.nameRu + p.nameEn).toLowerCase().includes(searchQuery.toLowerCase())
		)
		: visibleProducts;

	const langKey = (prefix: string) => `${prefix}${activeLang.charAt(0).toUpperCase() + activeLang.slice(1)}`;

	if (!user) return null;

	return (
		<div className="adm">
			{/* Sidebar */}
			<aside className="adm-side">
				<div className="adm-side-top">
					<div className="adm-brand">
						<div className="adm-brand-icon">P</div>
						<div>
							<div className="adm-brand-name">Petronix</div>
							<div className="adm-brand-sub">Admin Panel</div>
						</div>
					</div>

					<nav className="adm-nav">
						<button
							className={`adm-nav-item${activeTab === "products" ? " active" : ""}`}
							onClick={() => setActiveTab("products")}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
							Mahsulotlar
						</button>
						<button
							className={`adm-nav-item${activeTab === "orders" ? " active" : ""}`}
							onClick={() => setActiveTab("orders")}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
							Buyurtmalar
						</button>
						<button
							className={`adm-nav-item${activeTab === "warehouse" ? " active" : ""}`}
							onClick={() => setActiveTab("warehouse")}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M3 21h18"/><rect x="7" y="13" width="10" height="8"/></svg>
							Ombor
						</button>
						<button
							className={`adm-nav-item${activeTab === "reports" ? " active" : ""}`}
							onClick={() => setActiveTab("reports")}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="12" y="6" width="3" height="11"/><rect x="17" y="13" width="3" height="4"/></svg>
							Hisobotlar
						</button>
						{isAdmin && (
							<button
								className={`adm-nav-item${activeTab === "categories" ? " active" : ""}`}
								onClick={() => setActiveTab("categories")}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
								Kategoriyalar
							</button>
						)}
						{isAdmin && (
							<button
								className={`adm-nav-item${activeTab === "banners" ? " active" : ""}`}
								onClick={() => setActiveTab("banners")}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M2 17l5-5 4 4 5-5 6 6"/></svg>
								Karusel
							</button>
						)}
					</nav>
				</div>

				<div className="adm-side-bottom">
					<div className="adm-user">
						<div className="adm-user-avatar">{user.email[0].toUpperCase()}</div>
						<div className="adm-user-info">
							<div className="adm-user-email">{user.email}</div>
							<div className="adm-user-role">{user.role === "ADMIN" ? "Administrator" : "Diller"}</div>
						</div>
					</div>
					<button className="adm-logout" onClick={handleLogout}>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
						Chiqish
					</button>
				</div>
			</aside>

			{/* Main content */}
			<main className="adm-main">
				{/* =================== PRODUCTS =================== */}
				{activeTab === "products" && (
					<>
						<div className="adm-toolbar">
							<div>
								<h1 className="adm-page-title">Mahsulotlar</h1>
								<p className="adm-page-sub">{visibleProducts.length} ta mahsulot</p>
							</div>
							<div className="adm-toolbar-actions">
								<div className="adm-search">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
									<input
										type="text"
										placeholder="Qidirish..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
								<button
									className="adm-btn-add"
									onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_PRODUCT); }}
								>
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
									Qo'shish
								</button>
							</div>
						</div>

						{/* Product form modal */}
						{showForm && (
							<div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}>
								<div className="adm-modal">
									<div className="adm-modal-header">
										<h2>{editingId ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</h2>
										<button className="adm-modal-close" onClick={cancelEdit}>
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
										</button>
									</div>

									{/* Lang tabs */}
									<div className="adm-lang-tabs">
										{LANGS.map((l) => (
											<button
												key={l.key}
												className={`adm-lang-tab${activeLang === l.key ? " active" : ""}`}
												onClick={() => setActiveLang(l.key)}
											>
												<span>{l.flag}</span> {l.label}
											</button>
										))}
									</div>

									<form className="adm-form" onSubmit={handleSubmit}>
										<div className="adm-form-grid">
											<div className="adm-field">
												<label>Nomi ({LANGS.find(l => l.key === activeLang)?.label})</label>
												<input
													type="text"
													placeholder={`Mahsulot nomi`}
													value={(form as any)[langKey("name")]}
													onChange={(e) => setForm((p) => ({ ...p, [langKey("name")]: e.target.value }))}
													required={activeLang === "uz"}
												/>
											</div>
											<div className="adm-field">
												<label>Kategoriya</label>
												<select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, subtype: "" }))} required>
													<option value="">— tanlang —</option>
													{categories.map((c) => (
														<option key={c.id} value={c.slug}>{c.nameUz || c.nameRu || c.nameEn || c.name}</option>
													))}
												</select>
											</div>
											{(() => {
												const subs = categories.find((c) => c.slug === form.type)?.subcategories ?? [];
												if (subs.length === 0) return null;
												return (
													<div className="adm-field">
														<label>Subkategoriya</label>
														<select value={form.subtype} onChange={(e) => setForm((p) => ({ ...p, subtype: e.target.value }))}>
															<option value="">— yo'q —</option>
															{subs.map((s) => (
																<option key={s.id} value={s.slug}>{s.nameUz || s.nameRu || s.nameEn || s.name}</option>
															))}
														</select>
													</div>
												);
											})()}
										</div>

										<div className="adm-field">
											<label>Tavsif ({LANGS.find(l => l.key === activeLang)?.label})</label>
											<textarea
												placeholder="Mahsulot tavsifi"
												rows={3}
												value={(form as any)[langKey("description")]}
												onChange={(e) => setForm((p) => ({ ...p, [langKey("description")]: e.target.value }))}
											/>
										</div>

										<div className="adm-prices">
											<div className="adm-field">
												<label>Tannarx (USD)</label>
												<input type="number" step="0.01" min="0" value={form.costPrice || ""} placeholder="0.00"
													onChange={(e) => setForm((p) => ({ ...p, costPrice: Number(e.target.value) }))} />
											</div>
											<div className="adm-field">
												<label>Sotuv narxi (USD)</label>
												<input type="number" step="0.01" min="0" value={form.sellPrice || ""} placeholder="0.00"
													onChange={(e) => setForm((p) => ({ ...p, sellPrice: Number(e.target.value) }))} required />
											</div>
											<div className="adm-field">
												<label>Optom narx (USD)</label>
												<input type="number" step="0.01" min="0" value={form.wholesalePrice || ""} placeholder="0.00"
													onChange={(e) => setForm((p) => ({ ...p, wholesalePrice: Number(e.target.value) }))} />
											</div>
										</div>

										<div className="adm-field">
											<label>Rasm</label>
											<ImageUpload
												value={form.image}
												onChange={(path) => setForm((p) => ({ ...p, image: path }))}
												onError={(msg) => setError(msg)}
											/>
										</div>

										{error && <div className="adm-error">{error}</div>}

										<div className="adm-form-actions">
											<button type="button" className="adm-btn-cancel" onClick={cancelEdit}>Bekor qilish</button>
											<button type="submit" className="adm-btn-save" disabled={submitting}>
												{submitting ? "Saqlanmoqda..." : editingId ? "Yangilash" : "Qo'shish"}
											</button>
										</div>
									</form>
								</div>
							</div>
						)}

						{/* Products table */}
						{loading ? (
							<div className="adm-loading"><div className="adm-spinner" />Yuklanmoqda...</div>
						) : filteredProducts.length === 0 ? (
							<div className="adm-empty">
								<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
								<p>{searchQuery ? "Topilmadi" : "Mahsulotlar yo'q"}</p>
								<button className="adm-btn-add" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_PRODUCT); }}>
									Birinchi mahsulotni qo'shing
								</button>
							</div>
						) : (
							<div className="adm-table-wrap">
								<table className="adm-table">
									<thead>
										<tr>
											<th>Rasm</th>
											<th>Nomi</th>
											<th>Kategoriya</th>
											<th>Narx</th>
											{isAdmin && <th>Egasi</th>}
											<th></th>
										</tr>
									</thead>
									<tbody>
										{filteredProducts.map((p) => (
											<tr key={p.id} className={editingId === p.id ? "is-editing" : ""}>
												<td>
													{p.image ? (
														<img src={imgUrl(p.image)} alt="" className="adm-table-img" />
													) : (
														<div className="adm-table-img-ph">
															<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
														</div>
													)}
												</td>
												<td>
													<div className="adm-table-name">{p.nameUz || p.nameRu || p.nameEn}</div>
												</td>
												<td>
													<span className="adm-table-badge">
														{(() => { const c = categories.find((c) => c.slug === p.type); return c ? (c.nameUz || c.nameRu || c.nameEn || c.name) : p.type; })()}
													</span>
													{p.subtype && (
														<span className="adm-table-badge adm-table-badge-sub">
															{(() => {
																const c = categories.find((c) => c.slug === p.type);
																const s = c?.subcategories?.find((s) => s.slug === p.subtype);
																return s ? (s.nameUz || s.nameRu || s.nameEn || s.name) : p.subtype;
															})()}
														</span>
													)}
												</td>
												<td className="adm-table-price">${p.sellPrice}</td>
												{isAdmin && <td className="adm-table-owner">{p.owner?.name || "—"}</td>}
												<td>
													<div className="adm-table-actions">
														<button className="adm-action-btn edit" onClick={() => startEdit(p)} title="Tahrirlash">
															<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
														</button>
														<button className="adm-action-btn delete" onClick={() => handleDelete(p.id)} title="O'chirish">
															<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}

				{/* =================== ORDERS =================== */}
				{activeTab === "orders" && (
					<>
						<div className="adm-toolbar">
							<div>
								<h1 className="adm-page-title">Buyurtmalar</h1>
								<p className="adm-page-sub">{orders.length} ta buyurtma</p>
							</div>
						</div>

						{ordersLoading ? (
							<div className="adm-loading"><div className="adm-spinner" />Yuklanmoqda...</div>
						) : orders.length === 0 ? (
							<div className="adm-empty">
								<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
								<p>Buyurtmalar yo'q</p>
							</div>
						) : (
							<div className="adm-table-wrap">
								<table className="adm-table">
									<thead>
										<tr>
											<th>#</th><th>Mijoz</th><th>Telefon</th><th>Summa</th><th>To'lov</th><th>Holat</th><th></th>
										</tr>
									</thead>
									<tbody>
										{orders.map((o) => (
											<Fragment key={o.id}>
												<tr>
													<td><button className="adm-link-btn" onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>#{o.id.slice(-6)}</button></td>
													<td>{o.customerName}</td>
													<td>{o.customerPhone}</td>
													<td className="adm-table-price">${o.total}</td>
													<td>
														{o.payment?.status === "PAID" ? (
															<span className="adm-table-badge adm-table-badge-sub">PAID</span>
														) : isAdmin ? (
															<button className="adm-link-btn" onClick={() => handlePaymentConfirm(o.id)}>To'lovni tasdiqlash</button>
														) : <span className="adm-table-badge">PENDING</span>}
													</td>
													<td>
														{isAdmin ? (
															<select className="adm-status-select" value={o.status} onChange={(e) => handleOrderStatus(o.id, e.target.value)}>
																{ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
															</select>
														) : <span className="adm-table-badge">{ORDER_STATUS_LABEL[o.status]}</span>}
													</td>
													<td><button className="adm-link-btn" onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>{expandedOrder === o.id ? "▲" : "▼"}</button></td>
												</tr>
												{expandedOrder === o.id && (
													<tr className="adm-order-detail-row">
														<td colSpan={7}>
															<div className="adm-order-detail">
																{o.address && <div><strong>Manzil:</strong> {o.address}</div>}
																{o.comment && <div><strong>Izoh:</strong> {o.comment}</div>}
																<ul className="adm-order-items">
																	{o.items.map((it) => (
																		<li key={it.id}>{it.nameSnapshot} — {it.qty} × ${it.unitPrice} = <strong>${it.subtotal}</strong></li>
																	))}
																</ul>
															</div>
														</td>
													</tr>
												)}
											</Fragment>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}

				{/* =================== WAREHOUSE =================== */}
				{activeTab === "warehouse" && (
					<>
						<div className="adm-toolbar">
							<div>
								<h1 className="adm-page-title">Ombor</h1>
								<p className="adm-page-sub">{stock.length} ta pozitsiya</p>
							</div>
							{isAdmin && (
								<div className="adm-toolbar-actions">
									<button className="adm-btn-add" onClick={() => setShowSupplierForm(true)}>+ Yetkazib beruvchi</button>
									<button className="adm-btn-add" onClick={() => setShowSupplyForm(true)}>+ Kirim (приход)</button>
								</div>
							)}
						</div>

						{/* Supplier modal */}
						{showSupplierForm && isAdmin && (
							<div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSupplierForm(false); }}>
								<div className="adm-modal adm-modal-sm">
									<div className="adm-modal-header"><h2>Yangi yetkazib beruvchi</h2>
										<button className="adm-modal-close" onClick={() => setShowSupplierForm(false)}>✕</button></div>
									<form className="adm-form" onSubmit={handleSupplierSubmit}>
										<div className="adm-field"><label>Nomi</label>
											<input value={supplierForm.name} required onChange={(e) => setSupplierForm((p) => ({ ...p, name: e.target.value }))} /></div>
										<div className="adm-field"><label>Telefon</label>
											<input value={supplierForm.phone} onChange={(e) => setSupplierForm((p) => ({ ...p, phone: e.target.value }))} /></div>
										<div className="adm-form-actions">
											<button type="button" className="adm-btn-cancel" onClick={() => setShowSupplierForm(false)}>Bekor</button>
											<button type="submit" className="adm-btn-save">Saqlash</button>
										</div>
									</form>
								</div>
							</div>
						)}

						{/* Supply (receipt) modal */}
						{showSupplyForm && isAdmin && (
							<div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSupplyForm(false); }}>
								<div className="adm-modal">
									<div className="adm-modal-header"><h2>Kirim (приход)</h2>
										<button className="adm-modal-close" onClick={() => setShowSupplyForm(false)}>✕</button></div>
									<form className="adm-form" onSubmit={handleSupplySubmit}>
										<div className="adm-field"><label>Yetkazib beruvchi</label>
											<select value={supplyForm.supplierId} onChange={(e) => setSupplyForm((p) => ({ ...p, supplierId: e.target.value }))}>
												<option value="">— ixtiyoriy —</option>
												{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
											</select>
										</div>
										{supplyForm.items.map((it, idx) => (
											<div className="adm-supply-row" key={idx}>
												<select value={it.productId} onChange={(e) => setSupplyForm((p) => { const items = [...p.items]; items[idx] = { ...items[idx], productId: e.target.value }; return { ...p, items }; })} required>
													<option value="">— mahsulot —</option>
													{products.map((pr) => <option key={pr.id} value={pr.id}>{pr.nameUz || pr.nameRu || pr.nameEn}</option>)}
												</select>
												<input type="number" min={1} placeholder="Soni" value={it.qty} onChange={(e) => setSupplyForm((p) => { const items = [...p.items]; items[idx] = { ...items[idx], qty: Number(e.target.value) }; return { ...p, items }; })} />
												<input type="number" step="0.01" min={0} placeholder="Tannarx $" value={it.unitCost} onChange={(e) => setSupplyForm((p) => { const items = [...p.items]; items[idx] = { ...items[idx], unitCost: Number(e.target.value) }; return { ...p, items }; })} />
												<button type="button" className="adm-action-btn delete" onClick={() => setSupplyForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>✕</button>
											</div>
										))}
										<button type="button" className="adm-link-btn" onClick={() => setSupplyForm((p) => ({ ...p, items: [...p.items, { productId: "", qty: 1, unitCost: 0 }] }))}>+ Pozitsiya qo'shish</button>
										<div className="adm-form-actions">
											<button type="button" className="adm-btn-cancel" onClick={() => setShowSupplyForm(false)}>Bekor</button>
											<button type="submit" className="adm-btn-save" disabled={supplySaving}>{supplySaving ? "..." : "Kirim qilish"}</button>
										</div>
									</form>
								</div>
							</div>
						)}

						{whLoading ? (
							<div className="adm-loading"><div className="adm-spinner" />Yuklanmoqda...</div>
						) : (
							<>
								{/* Stock table */}
								<div className="adm-table-wrap">
									<table className="adm-table">
										<thead><tr><th>Mahsulot</th><th>Qoldiq</th><th>Min</th><th>Qiymat</th>{isAdmin && <th></th>}</tr></thead>
										<tbody>
											{stock.length === 0 ? (
												<tr><td colSpan={isAdmin ? 5 : 4} className="adm-muted">Qoldiqlar yo'q</td></tr>
											) : stock.map((s) => (
												<tr key={s.id} className={s.minQuantity > 0 && s.quantity <= s.minQuantity ? "adm-low" : ""}>
													<td>{s.product.nameUz || s.product.nameRu || s.product.nameEn}</td>
													<td className="adm-table-price">{s.quantity} {s.product.unit}</td>
													<td className="adm-muted">{s.minQuantity || "—"}</td>
													<td>${(s.quantity * s.product.costPrice).toFixed(2)}</td>
													{isAdmin && (
														<td>
															<div className="adm-table-actions">
																<button className="adm-link-btn" onClick={() => handleAdjust(s.productId, s.quantity)}>Tuzatish</button>
																<button className="adm-link-btn adm-danger" onClick={() => handleWriteOff(s.productId)}>Chiqarish</button>
															</div>
														</td>
													)}
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{/* Movements */}
								<h3 className="adm-section-title">Harakatlar tarixi</h3>
								<div className="adm-table-wrap">
									<table className="adm-table">
										<thead><tr><th>Sana</th><th>Mahsulot</th><th>Turi</th><th>Soni</th><th>Sabab</th></tr></thead>
										<tbody>
											{movements.length === 0 ? (
												<tr><td colSpan={5} className="adm-muted">Harakatlar yo'q</td></tr>
											) : movements.map((m) => (
												<tr key={m.id}>
													<td className="adm-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
													<td>{m.product.nameUz || m.product.nameRu || m.product.nameEn}</td>
													<td><span className="adm-table-badge">{MOVEMENT_LABEL[m.type]}</span></td>
													<td className={m.qty < 0 ? "adm-danger" : "adm-table-price"}>{m.qty > 0 ? "+" : ""}{m.qty}</td>
													<td className="adm-muted">{m.reason}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</>
						)}
					</>
				)}

				{/* =================== REPORTS =================== */}
				{activeTab === "reports" && (
					<>
						<div className="adm-toolbar">
							<div>
								<h1 className="adm-page-title">Hisobotlar</h1>
								<p className="adm-page-sub">1C uslubidagi hisobotlar</p>
							</div>
						</div>

						<div className="adm-rep-controls">
							<div className="adm-rep-tabs">
								{([["sales", "Sotuvlar"], ["stock", "Qoldiqlar"], ["profit", "Foyda"], ["turnover", "Aylanma"]] as const).map(([k, label]) => (
									<button key={k} className={`adm-rep-tab${reportType === k ? " active" : ""}`} onClick={() => setReportType(k)}>{label}</button>
								))}
							</div>
							{reportType !== "stock" && (
								<div className="adm-rep-dates">
									<input type="date" value={repFrom} onChange={(e) => setRepFrom(e.target.value)} />
									<span>—</span>
									<input type="date" value={repTo} onChange={(e) => setRepTo(e.target.value)} />
									{reportType === "turnover" && (
										<select value={turnoverBy} onChange={(e) => setTurnoverBy(e.target.value as any)}>
											<option value="category">Kategoriya bo'yicha</option>
											<option value="dealer">Diler bo'yicha</option>
										</select>
									)}
								</div>
							)}
						</div>

						{reportLoading ? (
							<div className="adm-loading"><div className="adm-spinner" />Yuklanmoqda...</div>
						) : !reportData ? (
							<div className="adm-empty"><p>Ma'lumot yo'q</p></div>
						) : (
							<>
								{/* SALES */}
								{reportType === "sales" && (
									<>
										<div className="adm-rep-cards">
											<div className="adm-rep-card"><span>Tushum</span><strong>${(reportData.totals?.revenue ?? 0).toFixed(2)}</strong></div>
											<div className="adm-rep-card"><span>Buyurtmalar</span><strong>{reportData.totals?.orders ?? 0}</strong></div>
											<div className="adm-rep-card"><span>O'rtacha chek</span><strong>${(reportData.totals?.avgCheck ?? 0).toFixed(2)}</strong></div>
										</div>
										<button className="adm-link-btn" onClick={() => exportCsv(["Sana", "Tushum", "Buyurtma", "Soni"], reportData.rows.map((r: any) => [r.period, r.revenue, r.orders, r.qty]), "sales.csv")}>⬇ CSV</button>
										<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Sana</th><th>Tushum</th><th>Buyurtmalar</th><th>Soni</th></tr></thead>
											<tbody>{reportData.rows.length === 0 ? <tr><td colSpan={4} className="adm-muted">Sotuvlar yo'q</td></tr> : reportData.rows.map((r: any) => (
												<tr key={r.period}><td>{r.period}</td><td className="adm-table-price">${r.revenue.toFixed(2)}</td><td>{r.orders}</td><td>{r.qty}</td></tr>
											))}</tbody></table></div>
									</>
								)}

								{/* PROFIT */}
								{reportType === "profit" && (
									<>
										<div className="adm-rep-cards">
											<div className="adm-rep-card"><span>Tushum</span><strong>${(reportData.totals?.revenue ?? 0).toFixed(2)}</strong></div>
											<div className="adm-rep-card"><span>Tannarx</span><strong>${(reportData.totals?.cost ?? 0).toFixed(2)}</strong></div>
											<div className="adm-rep-card"><span>Foyda</span><strong className="adm-danger" style={{ color: "#22c55e" }}>${(reportData.totals?.profit ?? 0).toFixed(2)}</strong></div>
											<div className="adm-rep-card"><span>Margin</span><strong>{(reportData.totals?.margin ?? 0).toFixed(1)}%</strong></div>
										</div>
										<button className="adm-link-btn" onClick={() => exportCsv(["Mahsulot", "Tushum", "Tannarx", "Foyda", "Soni"], reportData.rows.map((r: any) => [r.name, r.revenue, r.cost, r.profit, r.qty]), "profit.csv")}>⬇ CSV</button>
										<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mahsulot</th><th>Tushum</th><th>Tannarx</th><th>Foyda</th><th>Soni</th></tr></thead>
											<tbody>{reportData.rows.length === 0 ? <tr><td colSpan={5} className="adm-muted">Ma'lumot yo'q</td></tr> : reportData.rows.map((r: any, i: number) => (
												<tr key={i}><td>{r.name}</td><td>${r.revenue.toFixed(2)}</td><td>${r.cost.toFixed(2)}</td><td className="adm-table-price">${r.profit.toFixed(2)}</td><td>{r.qty}</td></tr>
											))}</tbody></table></div>
									</>
								)}

								{/* TURNOVER */}
								{reportType === "turnover" && (
									<>
										<button className="adm-link-btn" onClick={() => exportCsv([turnoverBy === "dealer" ? "Diler" : "Kategoriya", "Tushum", "Soni"], reportData.rows.map((r: any) => [r.label, r.revenue, r.qty]), "turnover.csv")}>⬇ CSV</button>
										<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>{turnoverBy === "dealer" ? "Diler" : "Kategoriya"}</th><th>Tushum</th><th>Soni</th></tr></thead>
											<tbody>{reportData.rows.length === 0 ? <tr><td colSpan={3} className="adm-muted">Ma'lumot yo'q</td></tr> : reportData.rows.map((r: any, i: number) => (
												<tr key={i}><td>{r.label}</td><td className="adm-table-price">${r.revenue.toFixed(2)}</td><td>{r.qty}</td></tr>
											))}</tbody></table></div>
									</>
								)}

								{/* STOCK */}
								{reportType === "stock" && (
									<>
										<div className="adm-rep-cards">
											<div className="adm-rep-card"><span>Pozitsiyalar</span><strong>{reportData.totals?.positions ?? 0}</strong></div>
											<div className="adm-rep-card"><span>Jami soni</span><strong>{reportData.totals?.totalQty ?? 0}</strong></div>
											<div className="adm-rep-card"><span>Qoldiq qiymati</span><strong>${(reportData.totals?.totalValue ?? 0).toFixed(2)}</strong></div>
											<div className="adm-rep-card"><span>Kam qoldiq</span><strong className="adm-danger">{reportData.low?.length ?? 0}</strong></div>
										</div>
										<button className="adm-link-btn" onClick={() => exportCsv(["Mahsulot", "Qoldiq", "Tannarx", "Qiymat"], reportData.items.map((r: any) => [r.name, r.quantity, r.costPrice, r.value]), "stock.csv")}>⬇ CSV</button>
										<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mahsulot</th><th>Qoldiq</th><th>Tannarx</th><th>Qiymat</th></tr></thead>
											<tbody>{reportData.items.length === 0 ? <tr><td colSpan={4} className="adm-muted">Qoldiqlar yo'q</td></tr> : reportData.items.map((r: any, i: number) => (
												<tr key={i}><td>{r.name}</td><td>{r.quantity} {r.unit}</td><td>${r.costPrice}</td><td className="adm-table-price">${r.value.toFixed(2)}</td></tr>
											))}</tbody></table></div>
									</>
								)}
							</>
						)}
					</>
				)}

				{/* =================== CATEGORIES =================== */}
				{activeTab === "categories" && isAdmin && (
					<>
						<div className="adm-toolbar">
							<div>
								<h1 className="adm-page-title">Kategoriyalar</h1>
								<p className="adm-page-sub">{categories.length} ta kategoriya</p>
							</div>
							<button
								className="adm-btn-add"
								onClick={() => { setShowCatForm(true); setEditingCatId(null); setCatForm(EMPTY_CATEGORY); }}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
								Qo'shish
							</button>
						</div>

						{showCatForm && (
							<div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) cancelCatEdit(); }}>
								<div className="adm-modal adm-modal-sm">
									<div className="adm-modal-header">
										<h2>{editingCatId ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</h2>
										<button className="adm-modal-close" onClick={cancelCatEdit}>
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
										</button>
									</div>
									<form className="adm-form" onSubmit={handleCatSubmit}>
										<div className="adm-form-grid">
											<div className="adm-field">
												<label>Nomi (UZ)</label>
												<input type="text" placeholder="Masalan: Klapanlar" value={catForm.nameUz}
													onChange={(e) => setCatForm((p) => ({ ...p, nameUz: e.target.value }))} required />
											</div>
											<div className="adm-field">
												<label>Nomi (RU)</label>
												<input type="text" placeholder="Например: Клапаны" value={catForm.nameRu}
													onChange={(e) => setCatForm((p) => ({ ...p, nameRu: e.target.value }))} />
											</div>
											<div className="adm-field">
												<label>Nomi (EN)</label>
												<input type="text" placeholder="E.g.: Valves" value={catForm.nameEn}
													onChange={(e) => setCatForm((p) => ({ ...p, nameEn: e.target.value }))} />
											</div>
											<div className="adm-field">
												<label>Slug</label>
												<input type="text" placeholder="Masalan: klapanlar" value={catForm.slug}
													onChange={(e) => setCatForm((p) => ({ ...p, slug: e.target.value }))} required />
											</div>
										</div>
										{catError && <div className="adm-error">{catError}</div>}
										<div className="adm-form-actions">
											<button type="button" className="adm-btn-cancel" onClick={cancelCatEdit}>Bekor qilish</button>
											<button type="submit" className="adm-btn-save" disabled={catSubmitting}>
												{catSubmitting ? "Saqlanmoqda..." : editingCatId ? "Yangilash" : "Qo'shish"}
											</button>
										</div>
									</form>
								</div>
							</div>
						)}

						{showSubForm && (
							<div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) cancelSubEdit(); }}>
								<div className="adm-modal adm-modal-sm">
									<div className="adm-modal-header">
										<h2>{editingSubId ? "Subkategoriyani tahrirlash" : "Yangi subkategoriya"}</h2>
										<button className="adm-modal-close" onClick={cancelSubEdit}>
											<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
										</button>
									</div>
									<form className="adm-form" onSubmit={handleSubSubmit}>
										<div className="adm-field">
											<label>Kategoriya</label>
											<select value={subForm.categoryId} onChange={(e) => setSubForm((p) => ({ ...p, categoryId: e.target.value }))} required>
												<option value="">— tanlang —</option>
												{categories.map((c) => (
													<option key={c.id} value={c.id}>{c.nameUz || c.nameRu || c.nameEn || c.name}</option>
												))}
											</select>
										</div>
										<div className="adm-form-grid">
											<div className="adm-field">
												<label>Nomi (UZ)</label>
												<input type="text" placeholder="Masalan: Reduktorlar" value={subForm.nameUz}
													onChange={(e) => setSubForm((p) => ({ ...p, nameUz: e.target.value }))} required />
											</div>
											<div className="adm-field">
												<label>Nomi (RU)</label>
												<input type="text" placeholder="Например: Редукторы" value={subForm.nameRu}
													onChange={(e) => setSubForm((p) => ({ ...p, nameRu: e.target.value }))} />
											</div>
											<div className="adm-field">
												<label>Nomi (EN)</label>
												<input type="text" placeholder="E.g.: Reducers" value={subForm.nameEn}
													onChange={(e) => setSubForm((p) => ({ ...p, nameEn: e.target.value }))} />
											</div>
											<div className="adm-field">
												<label>Slug</label>
												<input type="text" placeholder="Masalan: reduktorlar" value={subForm.slug}
													onChange={(e) => setSubForm((p) => ({ ...p, slug: e.target.value }))} required />
											</div>
										</div>
										<div className="adm-field">
											<label>Tartib raqami</label>
											<input type="number" value={subForm.order} min={0}
												onChange={(e) => setSubForm((p) => ({ ...p, order: Number(e.target.value) }))} />
										</div>
										{subError && <div className="adm-error">{subError}</div>}
										<div className="adm-form-actions">
											<button type="button" className="adm-btn-cancel" onClick={cancelSubEdit}>Bekor qilish</button>
											<button type="submit" className="adm-btn-save" disabled={subSubmitting}>
												{subSubmitting ? "Saqlanmoqda..." : editingSubId ? "Yangilash" : "Qo'shish"}
											</button>
										</div>
									</form>
								</div>
							</div>
						)}

						{catLoading ? (
							<div className="adm-loading"><div className="adm-spinner" />Yuklanmoqda...</div>
						) : categories.length === 0 ? (
							<div className="adm-empty">
								<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
								<p>Kategoriyalar yo'q</p>
							</div>
						) : (
							<div className="adm-cat-grid">
								{categories.map((cat) => (
									<div key={cat.id} className={`adm-cat-card${editingCatId === cat.id ? " is-editing" : ""}`}>
										<div className="adm-cat-body">
											<div className="adm-cat-name">{cat.nameUz || cat.nameRu || cat.nameEn || cat.name}</div>
											<div className="adm-cat-meta">/{cat.slug}</div>
										</div>
										<div className="adm-cat-actions">
											<button className="adm-action-btn edit" onClick={() => startCatEdit(cat)}>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
											</button>
											<button className="adm-action-btn delete" onClick={() => handleCatDelete(cat.id)}>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
											</button>
										</div>

										<div className="adm-cat-subs">
											<div className="adm-cat-subs-head">
												<span className="adm-cat-subs-title">Subkategoriyalar</span>
												<button className="adm-cat-subs-add" onClick={() => openNewSub(cat.id)}>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
													Qo'shish
												</button>
											</div>
											{(cat.subcategories ?? []).length === 0 ? (
												<div className="adm-cat-subs-empty">Subkategoriyalar yo'q</div>
											) : (
												<ul className="adm-cat-subs-list">
													{cat.subcategories!.map((sub) => (
														<li key={sub.id} className="adm-cat-sub-item">
															<span className="adm-cat-sub-name">{sub.nameUz || sub.nameRu || sub.nameEn || sub.name}</span>
															<span className="adm-cat-sub-slug">/{sub.slug}</span>
															<div className="adm-cat-sub-actions">
																<button className="adm-action-btn edit" onClick={() => startSubEdit(sub)} title="Tahrirlash">
																	<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
																</button>
																<button className="adm-action-btn delete" onClick={() => handleSubDelete(sub.id)} title="O'chirish">
																	<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
																</button>
															</div>
														</li>
													))}
												</ul>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</>
				)}

				{/* =================== CAROUSEL =================== */}
				{activeTab === "banners" && isAdmin && (
					<>
						<div className="adm-toolbar">
							<div>
								<h1 className="adm-page-title">Karusel</h1>
								<p className="adm-page-sub">{banners.length} ta rasm</p>
							</div>
						</div>

						<div className="adm-banner-upload">
							<label className="adm-field-label">Yangi rasm qo'shish</label>
							<ImageUpload
								key={bannerUploadKey}
								value=""
								onChange={(path) => handleBannerAdd(path)}
								onError={(msg) => setBannerError(msg)}
							/>
							{bannerSaving && <div className="adm-banner-saving">Saqlanmoqda...</div>}
							{bannerError && <div className="adm-error">{bannerError}</div>}
						</div>

						{bannerLoading ? (
							<div className="adm-loading"><div className="adm-spinner" />Yuklanmoqda...</div>
						) : banners.length === 0 ? (
							<div className="adm-empty">
								<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M2 17l5-5 4 4 5-5 6 6"/></svg>
								<p>Karusel rasmlari yo'q</p>
							</div>
						) : (
							<div className="adm-banner-grid">
								{banners.map((b) => (
									<div key={b.id} className="adm-banner-card">
										<img src={imgUrl(b.image)} alt="" className="adm-banner-img" />
										<button className="adm-banner-del" onClick={() => handleBannerDelete(b.id)} title="O'chirish">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
										</button>
									</div>
								))}
							</div>
						)}
					</>
				)}
			</main>
		</div>
	);
}
