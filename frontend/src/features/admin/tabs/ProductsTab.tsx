"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, imgUrl } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { AuthUser, Category, Product } from "../types";
import { AdminToolbar, EmptyState, LoadingState } from "../components/PageState";
import { IconEdit, IconPackageOutline, IconPlus, IconSearch, IconTrash } from "../components/Icons";
import { ProductFormModal } from "./ProductFormModal";

export function ProductsTab({ user }: { user: AuthUser }) {
	const router = useRouter();
	const isAdmin = user.role === "ADMIN";

	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	// null = closed, "new" = create, Product = edit
	const [editing, setEditing] = useState<Product | "new" | null>(null);

	async function loadProducts() {
		try {
			const res = await fetch(`${API_URL}/products/full`, { headers: authHeaders() });
			if (res.status === 401) { router.push("/login"); return; }
			setProducts(await res.json());
		} catch { /* ignore */ }
		finally { setLoading(false); }
	}

	useEffect(() => {
		loadProducts();
		fetch(`${API_URL}/categories`)
			.then((r) => r.json())
			.then((cats) => setCategories(Array.isArray(cats) ? cats : []))
			.catch(() => {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function handleDelete(id: string) {
		if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
		await fetch(`${API_URL}/products/${id}`, { method: "DELETE", headers: authHeaders() });
		await loadProducts();
	}

	const visibleProducts = isAdmin ? products : products.filter((p) => p.ownerId === user.id);
	const filteredProducts = searchQuery
		? visibleProducts.filter((p) =>
			(p.nameUz + p.nameRu + p.nameEn).toLowerCase().includes(searchQuery.toLowerCase())
		)
		: visibleProducts;

	const editingId = editing && editing !== "new" ? editing.id : null;
	const catName = (slug: string) => {
		const c = categories.find((c) => c.slug === slug);
		return c ? (c.nameUz || c.nameRu || c.nameEn || c.name) : slug;
	};

	return (
		<>
			<AdminToolbar title="Mahsulotlar" subtitle={`${visibleProducts.length} ta mahsulot`}>
				<div className="adm-toolbar-actions">
					<div className="adm-search">
						<IconSearch />
						<input
							type="text"
							placeholder="Qidirish..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<button className="adm-btn-add" onClick={() => setEditing("new")}>
						<IconPlus />
						Qo'shish
					</button>
				</div>
			</AdminToolbar>

			{editing && (
				<ProductFormModal
					product={editing === "new" ? null : editing}
					categories={categories}
					onClose={() => setEditing(null)}
					onSaved={async () => { setEditing(null); await loadProducts(); }}
				/>
			)}

			{loading ? (
				<LoadingState />
			) : filteredProducts.length === 0 ? (
				<EmptyState
					icon={<IconPackageOutline size={48} strokeWidth={1.5} />}
					text={searchQuery ? "Topilmadi" : "Mahsulotlar yo'q"}
				>
					<button className="adm-btn-add" onClick={() => setEditing("new")}>
						Birinchi mahsulotni qo'shing
					</button>
				</EmptyState>
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
												<IconPackageOutline size={18} />
											</div>
										)}
									</td>
									<td>
										<div className="adm-table-name">{p.nameUz || p.nameRu || p.nameEn}</div>
									</td>
									<td>
										{(p.types ?? []).map((slug) => (
											<span key={slug} className="adm-table-badge">{catName(slug)}</span>
										))}
										{(p.subtypes ?? []).map((slug) => {
											const s = categories
												.flatMap((c) => c.subcategories ?? [])
												.find((s) => s.slug === slug);
											return (
												<span key={slug} className="adm-table-badge adm-table-badge-sub">
													{s ? (s.nameUz || s.nameRu || s.nameEn || s.name) : slug}
												</span>
											);
										})}
									</td>
									<td className="adm-table-price">${p.sellPrice}</td>
									{isAdmin && <td className="adm-table-owner">{p.owner?.name || "—"}</td>}
									<td>
										<div className="adm-table-actions">
											<button className="adm-action-btn edit" onClick={() => { setEditing(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="Tahrirlash">
												<IconEdit />
											</button>
											<button className="adm-action-btn delete" onClick={() => handleDelete(p.id)} title="O'chirish">
												<IconTrash />
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
	);
}
