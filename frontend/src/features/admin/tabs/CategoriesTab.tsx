"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { Category, Subcategory } from "../types";
import { AdminToolbar, EmptyState, LoadingState } from "../components/PageState";
import { IconDrag, IconEdit, IconGrid, IconPlus, IconTrash } from "../components/Icons";
import { CategoryFormModal, SubcategoryFormModal } from "./CategoryModals";

export function CategoriesTab() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	// null = closed, "new" = create, entity = edit
	const [editingCat, setEditingCat] = useState<Category | "new" | null>(null);
	const [editingSub, setEditingSub] = useState<Subcategory | "new" | null>(null);
	const [newSubCategoryId, setNewSubCategoryId] = useState<string>("");

	const [dragCatId, setDragCatId] = useState<string | null>(null);
	const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);

	async function loadCategories() {
		try {
			const res = await fetch(`${API_URL}/categories`);
			setCategories(await res.json());
		} catch { /* ignore */ }
		finally { setLoading(false); }
	}

	useEffect(() => {
		loadCategories();
	}, []);

	async function handleCatDelete(id: string) {
		if (!confirm("Kategoriyani o'chirishni tasdiqlaysizmi?")) return;
		await fetch(`${API_URL}/categories/${id}`, { method: "DELETE", headers: authHeaders() });
		await loadCategories();
	}

	async function handleSubDelete(id: string) {
		if (!confirm("Subkategoriyani o'chirishni tasdiqlaysizmi?")) return;
		await fetch(`${API_URL}/subcategories/${id}`, { method: "DELETE", headers: authHeaders() });
		await loadCategories();
	}

	// Drag-and-drop reordering of categories.
	function handleCatDrop(targetId: string) {
		if (!dragCatId || dragCatId === targetId) { setDragCatId(null); setDragOverCatId(null); return; }
		const from = categories.findIndex((c) => c.id === dragCatId);
		const to = categories.findIndex((c) => c.id === targetId);
		if (from === -1 || to === -1) { setDragCatId(null); setDragOverCatId(null); return; }
		const next = [...categories];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		setCategories(next); // optimistic
		setDragCatId(null);
		setDragOverCatId(null);
		fetch(`${API_URL}/categories/reorder`, {
			method: "PATCH",
			headers: authHeaders(),
			body: JSON.stringify({ ids: next.map((c) => c.id) }),
		}).then((res) => { if (!res.ok) loadCategories(); }).catch(() => loadCategories());
	}

	const editingCatId = editingCat && editingCat !== "new" ? editingCat.id : null;

	return (
		<>
			<AdminToolbar title="Kategoriyalar" subtitle={`${categories.length} ta kategoriya`}>
				<button className="adm-btn-add" onClick={() => setEditingCat("new")}>
					<IconPlus />
					Qo'shish
				</button>
			</AdminToolbar>

			{editingCat && (
				<CategoryFormModal
					category={editingCat === "new" ? null : editingCat}
					onClose={() => setEditingCat(null)}
					onSaved={async () => { setEditingCat(null); await loadCategories(); }}
				/>
			)}

			{editingSub && (
				<SubcategoryFormModal
					subcategory={editingSub === "new" ? null : editingSub}
					defaultCategoryId={newSubCategoryId}
					categories={categories}
					onClose={() => setEditingSub(null)}
					onSaved={async () => { setEditingSub(null); await loadCategories(); }}
				/>
			)}

			{loading ? (
				<LoadingState />
			) : categories.length === 0 ? (
				<EmptyState icon={<IconGrid size={48} strokeWidth={1.5} />} text="Kategoriyalar yo'q" />
			) : (
				<div className="adm-cat-grid">
					{categories.map((cat) => (
						<div
							key={cat.id}
							className={`adm-cat-card${editingCatId === cat.id ? " is-editing" : ""}${dragCatId === cat.id ? " is-dragging" : ""}${dragOverCatId === cat.id ? " is-dragover" : ""}`}
							draggable
							onDragStart={(e) => { setDragCatId(cat.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", cat.id); }}
							onDragOver={(e) => { e.preventDefault(); if (dragOverCatId !== cat.id) setDragOverCatId(cat.id); }}
							onDragLeave={() => { if (dragOverCatId === cat.id) setDragOverCatId(null); }}
							onDrop={(e) => { e.preventDefault(); handleCatDrop(cat.id); }}
							onDragEnd={() => { setDragCatId(null); setDragOverCatId(null); }}
						>
							<div className="adm-cat-body">
								<span className="adm-cat-drag" title="Tartibni o'zgartirish uchun torting">
									<IconDrag />
								</span>
								<div className="adm-cat-name">{cat.nameUz || cat.nameRu || cat.nameEn || cat.name}</div>
								<div className="adm-cat-meta">/{cat.slug}</div>
							</div>
							<div className="adm-cat-actions">
								<button className="adm-action-btn edit" onClick={() => { setEditingCat(cat); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
									<IconEdit size={14} />
								</button>
								<button className="adm-action-btn delete" onClick={() => handleCatDelete(cat.id)}>
									<IconTrash size={14} />
								</button>
							</div>

							<div className="adm-cat-subs">
								<div className="adm-cat-subs-head">
									<span className="adm-cat-subs-title">Subkategoriyalar</span>
									<button className="adm-cat-subs-add" onClick={() => { setNewSubCategoryId(cat.id); setEditingSub("new"); }}>
										<IconPlus size={13} />
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
													<button className="adm-action-btn edit" onClick={() => { setEditingSub(sub); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="Tahrirlash">
														<IconEdit size={13} />
													</button>
													<button className="adm-action-btn delete" onClick={() => handleSubDelete(sub.id)} title="O'chirish">
														<IconTrash size={13} />
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
	);
}
