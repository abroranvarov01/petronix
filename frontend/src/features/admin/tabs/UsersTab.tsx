"use client";

import { API_URL } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { AdminUser } from "../types";
import { AdminToolbar, EmptyState, LoadingState } from "../components/PageState";
import { IconTrash, IconUsers } from "../components/Icons";

interface UsersTabProps {
	users: AdminUser[];
	loading: boolean;
	reload: () => Promise<void>;
	currentUserId: string;
}

export function UsersTab({ users, loading, reload, currentUserId }: UsersTabProps) {
	const pendingCount = users.filter((u) => u.status === "PENDING").length;

	async function setStatus(id: string, status: AdminUser["status"]) {
		const res = await fetch(`${API_URL}/users/${id}/status`, {
			method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status }),
		});
		if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.message || "Xatolik"); return; }
		await reload();
	}

	async function setRole(id: string, role: AdminUser["role"]) {
		const res = await fetch(`${API_URL}/users/${id}/role`, {
			method: "PATCH", headers: authHeaders(), body: JSON.stringify({ role }),
		});
		if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.message || "Xatolik"); return; }
		await reload();
	}

	async function handleDelete(id: string) {
		if (!confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) return;
		const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE", headers: authHeaders() });
		if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.message || "Xatolik"); return; }
		await reload();
	}

	return (
		<>
			<AdminToolbar
				title="Foydalanuvchilar"
				subtitle={`${users.length} ta foydalanuvchi${pendingCount > 0 ? ` · ${pendingCount} ta tasdiq kutmoqda` : ""}`}
			/>

			{loading ? (
				<LoadingState />
			) : users.length === 0 ? (
				<EmptyState icon={<IconUsers size={48} strokeWidth={1.5} />} text="Foydalanuvchilar yo'q" />
			) : (
				<div className="adm-table-wrap">
					<table className="adm-table">
						<thead>
							<tr>
								<th>Foydalanuvchi</th>
								<th>Rol</th>
								<th>Holat</th>
								<th>Mahsulot</th>
								<th>Sana</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{users.map((u) => {
								const self = u.id === currentUserId;
								return (
									<tr key={u.id} className={u.status === "PENDING" ? "is-pending" : ""}>
										<td>
											<div className="adm-table-name">{u.name || "—"}</div>
											<div className="adm-user-email-sm">{u.email}</div>
										</td>
										<td>
											<span className={`adm-role-badge${u.role === "ADMIN" ? " admin" : ""}`}>
												{u.role === "ADMIN" ? "Administrator" : "Diller"}
											</span>
										</td>
										<td>
											<span className={`adm-status-badge ${u.status.toLowerCase()}`}>
												{u.status === "PENDING" ? "Kutilmoqda" : u.status === "APPROVED" ? "Tasdiqlangan" : "Bloklangan"}
											</span>
										</td>
										<td className="adm-table-owner">{u._count?.products ?? 0}</td>
										<td className="adm-table-owner">{new Date(u.createdAt).toLocaleDateString()}</td>
										<td>
											{self ? (
												<span className="adm-user-self">Siz</span>
											) : (
												<div className="adm-table-actions">
													{u.status === "PENDING" && (
														<button className="adm-btn-sm approve" onClick={() => setStatus(u.id, "APPROVED")}>Tasdiqlash</button>
													)}
													{u.status === "APPROVED" && (
														<button className="adm-btn-sm block" onClick={() => setStatus(u.id, "BLOCKED")}>Bloklash</button>
													)}
													{u.status === "BLOCKED" && (
														<button className="adm-btn-sm approve" onClick={() => setStatus(u.id, "APPROVED")}>Blokdan chiqarish</button>
													)}
													<button
														className="adm-btn-sm role"
														onClick={() => setRole(u.id, u.role === "ADMIN" ? "DEALER" : "ADMIN")}
													>
														{u.role === "ADMIN" ? "Diller qilish" : "Admin qilish"}
													</button>
													<button className="adm-action-btn delete" onClick={() => handleDelete(u.id)} title="O'chirish">
														<IconTrash size={14} />
													</button>
												</div>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</>
	);
}
