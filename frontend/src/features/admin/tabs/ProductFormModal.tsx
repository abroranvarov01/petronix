"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import MultiImageUpload from "@/components/MultiImageUpload";
import { API_URL } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { EMPTY_PRODUCT, LANGS, ProductFormData, type Lang } from "../constants";
import type { Category, Product } from "../types";
import { Modal } from "../components/Modal";

type LangField = "nameUz" | "nameRu" | "nameEn" | "descriptionUz" | "descriptionRu" | "descriptionEn";

interface ProductFormModalProps {
	product: Product | null; // null = create
	categories: Category[];
	onClose: () => void;
	onSaved: () => void;
}

export function ProductFormModal({ product, categories, onClose, onSaved }: ProductFormModalProps) {
	const router = useRouter();
	const [activeLang, setActiveLang] = useState<Lang>("uz");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [form, setForm] = useState<ProductFormData>(() => product ? {
		nameUz: product.nameUz, nameRu: product.nameRu, nameEn: product.nameEn,
		descriptionUz: product.descriptionUz, descriptionRu: product.descriptionRu, descriptionEn: product.descriptionEn,
		types: product.types ?? [], subtypes: product.subtypes ?? [], image: product.image,
			images: product.images ?? (product.image ? [product.image] : []),
		costPrice: product.costPrice, sellPrice: product.sellPrice, wholesalePrice: product.wholesalePrice,
	} : EMPTY_PRODUCT);

	const langField = (prefix: "name" | "description"): LangField =>
		`${prefix}${activeLang.charAt(0).toUpperCase()}${activeLang.slice(1)}` as LangField;

	const langLabel = LANGS.find((l) => l.key === activeLang)?.label;

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (form.types.length === 0) { setError("Kamida bitta kategoriya tanlang"); return; }
		setSubmitting(true);
		setError(null);
		try {
			const url = product ? `${API_URL}/products/${product.id}` : `${API_URL}/products`;
			const method = product ? "PATCH" : "POST";
			const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
			if (res.status === 401) { router.push("/login"); return; }
			const data = await res.json();
			if (!res.ok) { setError(data.message ?? "Xatolik"); return; }
			onSaved();
		} catch { setError("Server xatosi"); }
		finally { setSubmitting(false); }
	}

	function toggleType(slug: string) {
		setForm((p) => {
			if (p.types.includes(slug)) {
				// Deselecting a category also drops its subcategory selections.
				const removedSubs = new Set(
					(categories.find((c) => c.slug === slug)?.subcategories ?? []).map((s) => s.slug),
				);
				return {
					...p,
					types: p.types.filter((t) => t !== slug),
					subtypes: p.subtypes.filter((s) => !removedSubs.has(s)),
				};
			}
			return { ...p, types: [...p.types, slug] };
		});
	}

	// Subcategories of all selected categories.
	const subs = categories
		.filter((c) => form.types.includes(c.slug))
		.flatMap((c) => c.subcategories ?? []);

	const toggleSub = (slug: string) =>
		setForm((p) => ({
			...p,
			subtypes: p.subtypes.includes(slug)
				? p.subtypes.filter((s) => s !== slug)
				: [...p.subtypes, slug],
		}));

	return (
		<Modal title={product ? "Mahsulotni tahrirlash" : "Yangi mahsulot"} onClose={onClose}>
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
					<div className="adm-field adm-field-full">
						<label>Nomi ({langLabel})</label>
						<input
							type="text"
							placeholder="Mahsulot nomi"
							value={form[langField("name")]}
							onChange={(e) => setForm((p) => ({ ...p, [langField("name")]: e.target.value }))}
							required={activeLang === "uz"}
						/>
					</div>
					<div className="adm-field adm-field-full">
						<label>Kategoriyalar <span className="adm-field-hint">(bir nechta tanlash mumkin)</span></label>
						<div className="adm-subtag-list">
							{categories.map((c) => {
								const on = form.types.includes(c.slug);
								return (
									<button
										type="button"
										key={c.id}
										className={`adm-subtag${on ? " on" : ""}`}
										onClick={() => toggleType(c.slug)}
									>
										{c.nameUz || c.nameRu || c.nameEn || c.name}
									</button>
								);
							})}
						</div>
					</div>
					{subs.length > 0 && (
						<div className="adm-field adm-field-full">
							<label>Subkategoriyalar <span className="adm-field-hint">(bir nechta tanlash mumkin)</span></label>
							<div className="adm-subtag-list">
								{subs.map((s) => {
									const on = form.subtypes.includes(s.slug);
									return (
										<button
											type="button"
											key={s.id}
											className={`adm-subtag${on ? " on" : ""}`}
											onClick={() => toggleSub(s.slug)}
										>
											{s.nameUz || s.nameRu || s.nameEn || s.name}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				<div className="adm-field">
					<label>Tavsif ({langLabel})</label>
					<textarea
						placeholder="Mahsulot tavsifi"
						rows={3}
						value={form[langField("description")]}
						onChange={(e) => setForm((p) => ({ ...p, [langField("description")]: e.target.value }))}
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
					<label>Rasmlar</label>
					<MultiImageUpload
						value={form.images}
						onChange={(paths) => setForm((p) => ({ ...p, images: paths, image: paths[0] ?? "" }))}
						onError={(msg) => setError(msg)}
					/>
				</div>

				{error && <div className="adm-error">{error}</div>}

				<div className="adm-form-actions">
					<button type="button" className="adm-btn-cancel" onClick={onClose}>Bekor qilish</button>
					<button type="submit" className="adm-btn-save" disabled={submitting}>
						{submitting ? "Saqlanmoqda..." : product ? "Yangilash" : "Qo'shish"}
					</button>
				</div>
			</form>
		</Modal>
	);
}
