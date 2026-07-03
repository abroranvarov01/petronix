"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "../constants";
import type { Order } from "../types";
import { AdminToolbar, EmptyState, LoadingState } from "../components/PageState";
import { IconCart } from "../components/Icons";

export function OrdersTab({ isAdmin }: { isAdmin: boolean }) {
	const router = useRouter();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

	async function loadOrders() {
		try {
			const res = await fetch(`${API_URL}/orders`, { headers: authHeaders() });
			if (res.status === 401) { router.push("/login"); return; }
			setOrders(await res.json());
		} catch { /* ignore */ }
		finally { setLoading(false); }
	}

	useEffect(() => {
		loadOrders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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

	return (
		<>
			<AdminToolbar title="Buyurtmalar" subtitle={`${orders.length} ta buyurtma`} />

			{loading ? (
				<LoadingState />
			) : orders.length === 0 ? (
				<EmptyState icon={<IconCart size={48} strokeWidth={1.5} />} text="Buyurtmalar yo'q" />
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
	);
}
