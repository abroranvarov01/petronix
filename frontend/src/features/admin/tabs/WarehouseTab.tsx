"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { MOVEMENT_LABEL } from "../constants";
import type { Movement, Product, StockRow, Supplier } from "../types";
import { AdminToolbar, LoadingState } from "../components/PageState";
import { Modal } from "../components/Modal";

const EMPTY_SUPPLY_ITEM = { productId: "", qty: 1, unitCost: 0 };

export function WarehouseTab({ isAdmin }: { isAdmin: boolean }) {
	const [stock, setStock] = useState<StockRow[]>([]);
	const [movements, setMovements] = useState<Movement[]>([]);
	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	const [showSupplyForm, setShowSupplyForm] = useState(false);
	const [supplyForm, setSupplyForm] = useState<{ supplierId: string; items: typeof EMPTY_SUPPLY_ITEM[] }>({ supplierId: "", items: [{ ...EMPTY_SUPPLY_ITEM }] });
	const [supplySaving, setSupplySaving] = useState(false);
	const [showSupplierForm, setShowSupplierForm] = useState(false);
	const [supplierForm, setSupplierForm] = useState({ name: "", phone: "", note: "" });

	async function loadWarehouse() {
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
		finally { setLoading(false); }
	}

	useEffect(() => {
		loadWarehouse();
		// Product list feeds the supply form (admin only).
		if (isAdmin) {
			fetch(`${API_URL}/products/full`, { headers: authHeaders() })
				.then((r) => r.json())
				.then((d) => setProducts(Array.isArray(d) ? d : []))
				.catch(() => {});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
			setSupplyForm({ supplierId: "", items: [{ ...EMPTY_SUPPLY_ITEM }] });
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

	function setSupplyItem(idx: number, patch: Partial<typeof EMPTY_SUPPLY_ITEM>) {
		setSupplyForm((p) => {
			const items = [...p.items];
			items[idx] = { ...items[idx], ...patch };
			return { ...p, items };
		});
	}

	return (
		<>
			<AdminToolbar title="Ombor" subtitle={`${stock.length} ta pozitsiya`}>
				{isAdmin && (
					<div className="adm-toolbar-actions">
						<button className="adm-btn-add" onClick={() => setShowSupplierForm(true)}>+ Yetkazib beruvchi</button>
						<button className="adm-btn-add" onClick={() => setShowSupplyForm(true)}>+ Kirim (приход)</button>
					</div>
				)}
			</AdminToolbar>

			{showSupplierForm && isAdmin && (
				<Modal title="Yangi yetkazib beruvchi" small onClose={() => setShowSupplierForm(false)}>
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
				</Modal>
			)}

			{showSupplyForm && isAdmin && (
				<Modal title="Kirim (приход)" onClose={() => setShowSupplyForm(false)}>
					<form className="adm-form" onSubmit={handleSupplySubmit}>
						<div className="adm-field"><label>Yetkazib beruvchi</label>
							<select value={supplyForm.supplierId} onChange={(e) => setSupplyForm((p) => ({ ...p, supplierId: e.target.value }))}>
								<option value="">— ixtiyoriy —</option>
								{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
							</select>
						</div>
						{supplyForm.items.map((it, idx) => (
							<div className="adm-supply-row" key={idx}>
								<select value={it.productId} onChange={(e) => setSupplyItem(idx, { productId: e.target.value })} required>
									<option value="">— mahsulot —</option>
									{products.map((pr) => <option key={pr.id} value={pr.id}>{pr.nameUz || pr.nameRu || pr.nameEn}</option>)}
								</select>
								<input type="number" min={1} placeholder="Soni" value={it.qty} onChange={(e) => setSupplyItem(idx, { qty: Number(e.target.value) })} />
								<input type="number" step="0.01" min={0} placeholder="Tannarx $" value={it.unitCost} onChange={(e) => setSupplyItem(idx, { unitCost: Number(e.target.value) })} />
								<button type="button" className="adm-action-btn delete" onClick={() => setSupplyForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>✕</button>
							</div>
						))}
						<button type="button" className="adm-link-btn" onClick={() => setSupplyForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_SUPPLY_ITEM }] }))}>+ Pozitsiya qo'shish</button>
						<div className="adm-form-actions">
							<button type="button" className="adm-btn-cancel" onClick={() => setShowSupplyForm(false)}>Bekor</button>
							<button type="submit" className="adm-btn-save" disabled={supplySaving}>{supplySaving ? "..." : "Kirim qilish"}</button>
						</div>
					</form>
				</Modal>
			)}

			{loading ? (
				<LoadingState />
			) : (
				<>
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
	);
}
