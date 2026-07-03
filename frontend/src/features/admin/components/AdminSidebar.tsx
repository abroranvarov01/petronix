"use client";

import type { AdminTab, AuthUser } from "../types";
import { IconCart, IconChart, IconGrid, IconImage, IconLogout, IconPackage, IconUsers, IconWarehouse } from "./Icons";

const NAV_ITEMS: { tab: AdminTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
	{ tab: "products", label: "Mahsulotlar", icon: <IconPackage /> },
	{ tab: "orders", label: "Buyurtmalar", icon: <IconCart /> },
	{ tab: "warehouse", label: "Ombor", icon: <IconWarehouse /> },
	{ tab: "reports", label: "Hisobotlar", icon: <IconChart /> },
	{ tab: "categories", label: "Kategoriyalar", icon: <IconGrid />, adminOnly: true },
	{ tab: "banners", label: "Karusel", icon: <IconImage />, adminOnly: true },
	{ tab: "users", label: "Foydalanuvchilar", icon: <IconUsers />, adminOnly: true },
];

interface AdminSidebarProps {
	user: AuthUser;
	activeTab: AdminTab;
	onTabChange: (tab: AdminTab) => void;
	pendingUsersCount: number;
	onLogout: () => void;
}

export function AdminSidebar({ user, activeTab, onTabChange, pendingUsersCount, onLogout }: AdminSidebarProps) {
	const isAdmin = user.role === "ADMIN";

	return (
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
					{NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
						<button
							key={item.tab}
							className={`adm-nav-item${activeTab === item.tab ? " active" : ""}`}
							onClick={() => onTabChange(item.tab)}
						>
							{item.icon}
							{item.label}
							{item.tab === "users" && pendingUsersCount > 0 && (
								<span className="adm-nav-badge">{pendingUsersCount}</span>
							)}
						</button>
					))}
				</nav>
			</div>

			<div className="adm-side-bottom">
				<div className="adm-user">
					<div className="adm-user-avatar">{user.email[0].toUpperCase()}</div>
					<div className="adm-user-info">
						<div className="adm-user-email">{user.email}</div>
						<div className="adm-user-role">{isAdmin ? "Administrator" : "Diller"}</div>
					</div>
				</div>
				<button className="adm-logout" onClick={onLogout}>
					<IconLogout />
					Chiqish
				</button>
			</div>
		</aside>
	);
}
