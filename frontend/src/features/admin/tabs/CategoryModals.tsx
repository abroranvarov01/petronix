"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { CategoryFormData, EMPTY_CATEGORY, EMPTY_SUBCATEGORY, SubcategoryFormData } from "../constants";
import type { Category, Subcategory } from "../types";
import { Modal } from "../components/Modal";

interface CategoryFormModalProps {
	category: Category | null; // null = create
	onClose: () => void;
	onSaved: () => void;
}

export function CategoryFormModal({ category, onClose, onSaved }: CategoryFormModalProps) {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState<CategoryFormData>(() => category ? {
		nameUz: category.nameUz || "", nameRu: category.nameRu || "", nameEn: category.nameEn || "",
		name: category.name || "", slug: category.slug, image: category.image, order: category.order,
	} : EMPTY_CATEGORY);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const url = category ? `${API_URL}/categories/${category.id}` : `${API_URL}/categories`;
			const method = category ? "PATCH" : "POST";
			const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
			if (res.status === 401) { router.push("/login"); return; }
			const data = await res.json();
			if (!res.ok) { setError(data.message ?? "Xatolik"); return; }
			onSaved();
		} catch { setError("Server xatosi"); }
		finally { setSubmitting(false); }
	}

	return (
		<Modal title={category ? "Kategoriyani tahrirlash" : "Yangi kategoriya"} small onClose={onClose}>
			<form className="adm-form" onSubmit={handleSubmit}>
				<div className="adm-form-grid">
					<div className="adm-field">
						<label>Nomi (UZ)</label>
						<input type="text" placeholder="Masalan: Klapanlar" value={form.nameUz}
							onChange={(e) => setForm((p) => ({ ...p, nameUz: e.target.value }))} required />
					</div>
					<div className="adm-field">
						<label>Nomi (RU)</label>
						<input type="text" placeholder="Например: Клапаны" value={form.nameRu}
							onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} />
					</div>
					<div className="adm-field">
						<label>Nomi (EN)</label>
						<input type="text" placeholder="E.g.: Valves" value={form.nameEn}
							onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} />
					</div>
					<div className="adm-field">
						<label>Slug</label>
						<input type="text" placeholder="Masalan: klapanlar" value={form.slug}
							onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} required />
					</div>
				</div>
				{error && <div className="adm-error">{error}</div>}
				<div className="adm-form-actions">
					<button type="button" className="adm-btn-cancel" onClick={onClose}>Bekor qilish</button>
					<button type="submit" className="adm-btn-save" disabled={submitting}>
						{submitting ? "Saqlanmoqda..." : category ? "Yangilash" : "Qo'shish"}
					</button>
				</div>
			</form>
		</Modal>
	);
}

interface SubcategoryFormModalProps {
	subcategory: Subcategory | null; // null = create
	defaultCategoryId?: string;
	categories: Category[];
	onClose: () => void;
	onSaved: () => void;
}

export function SubcategoryFormModal({ subcategory, defaultCategoryId, categories, onClose, onSaved }: SubcategoryFormModalProps) {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState<SubcategoryFormData>(() => subcategory ? {
		nameUz: subcategory.nameUz || "", nameRu: subcategory.nameRu || "", nameEn: subcategory.nameEn || "",
		name: subcategory.name || "", slug: subcategory.slug, image: subcategory.image || "", order: subcategory.order,
		categoryId: subcategory.categoryId,
	} : { ...EMPTY_SUBCATEGORY, categoryId: defaultCategoryId ?? "" });

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const url = subcategory ? `${API_URL}/subcategories/${subcategory.id}` : `${API_URL}/subcategories`;
			const method = subcategory ? "PATCH" : "POST";
			const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
			if (res.status === 401) { router.push("/login"); return; }
			const data = await res.json();
			if (!res.ok) { setError(data.message ?? "Xatolik"); return; }
			onSaved();
		} catch { setError("Server xatosi"); }
		finally { setSubmitting(false); }
	}

	return (
		<Modal title={subcategory ? "Subkategoriyani tahrirlash" : "Yangi subkategoriya"} small onClose={onClose}>
			<form className="adm-form" onSubmit={handleSubmit}>
				<div className="adm-field">
					<label>Kategoriya</label>
					<select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} required>
						<option value="">— tanlang —</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>{c.nameUz || c.nameRu || c.nameEn || c.name}</option>
						))}
					</select>
				</div>
				<div className="adm-form-grid">
					<div className="adm-field">
						<label>Nomi (UZ)</label>
						<input type="text" placeholder="Masalan: Reduktorlar" value={form.nameUz}
							onChange={(e) => setForm((p) => ({ ...p, nameUz: e.target.value }))} required />
					</div>
					<div className="adm-field">
						<label>Nomi (RU)</label>
						<input type="text" placeholder="Например: Редукторы" value={form.nameRu}
							onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} />
					</div>
					<div className="adm-field">
						<label>Nomi (EN)</label>
						<input type="text" placeholder="E.g.: Reducers" value={form.nameEn}
							onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} />
					</div>
					<div className="adm-field">
						<label>Slug</label>
						<input type="text" placeholder="Masalan: reduktorlar" value={form.slug}
							onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} required />
					</div>
				</div>
				<div className="adm-field">
					<label>Tartib raqami</label>
					<input type="number" value={form.order} min={0}
						onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))} />
				</div>
				{error && <div className="adm-error">{error}</div>}
				<div className="adm-form-actions">
					<button type="button" className="adm-btn-cancel" onClick={onClose}>Bekor qilish</button>
					<button type="submit" className="adm-btn-save" disabled={submitting}>
						{submitting ? "Saqlanmoqda..." : subcategory ? "Yangilash" : "Qo'shish"}
					</button>
				</div>
			</form>
		</Modal>
	);
}
