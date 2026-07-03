"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { API_URL, imgUrl } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { Banner } from "../types";
import { AdminToolbar, EmptyState, LoadingState } from "../components/PageState";
import { IconImage, IconTrash } from "../components/Icons";

export function BannersTab() {
	const router = useRouter();
	const [banners, setBanners] = useState<Banner[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// Remount the uploader after each upload so it resets to the empty state.
	const [uploadKey, setUploadKey] = useState(0);

	async function loadBanners() {
		try {
			const res = await fetch(`${API_URL}/banners`);
			setBanners(await res.json());
		} catch { setError("Yuklab bo'lmadi"); }
		finally { setLoading(false); }
	}

	useEffect(() => {
		loadBanners();
	}, []);

	async function handleAdd(image: string) {
		if (!image) return;
		setSaving(true);
		setError(null);
		try {
			const res = await fetch(`${API_URL}/banners`, {
				method: "POST",
				headers: authHeaders(),
				body: JSON.stringify({ image, order: banners.length }),
			});
			if (res.status === 401) { router.push("/login"); return; }
			if (!res.ok) { const d = await res.json(); setError(d.message ?? "Xatolik"); return; }
			await loadBanners();
		} catch { setError("Server xatosi"); }
		finally { setSaving(false); setUploadKey((k) => k + 1); }
	}

	async function handleDelete(id: string) {
		if (!confirm("Rasmni o'chirishni tasdiqlaysizmi?")) return;
		await fetch(`${API_URL}/banners/${id}`, { method: "DELETE", headers: authHeaders() });
		await loadBanners();
	}

	return (
		<>
			<AdminToolbar title="Karusel" subtitle={`${banners.length} ta rasm`} />

			<div className="adm-banner-upload">
				<label className="adm-field-label">Yangi rasm qo'shish</label>
				<ImageUpload
					key={uploadKey}
					value=""
					onChange={(path) => handleAdd(path)}
					onError={(msg) => setError(msg)}
				/>
				{saving && <div className="adm-banner-saving">Saqlanmoqda...</div>}
				{error && <div className="adm-error">{error}</div>}
			</div>

			{loading ? (
				<LoadingState />
			) : banners.length === 0 ? (
				<EmptyState icon={<IconImage size={48} strokeWidth={1.5} />} text="Karusel rasmlari yo'q" />
			) : (
				<div className="adm-banner-grid">
					{banners.map((b) => (
						<div key={b.id} className="adm-banner-card">
							<img src={imgUrl(b.image)} alt="" className="adm-banner-img" />
							<button className="adm-banner-del" onClick={() => handleDelete(b.id)} title="O'chirish">
								<IconTrash size={16} />
							</button>
						</div>
					))}
				</div>
			)}
		</>
	);
}
