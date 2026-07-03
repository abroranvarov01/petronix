"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./admin.css";
import { logout } from "@/lib/auth";
import type { AdminTab } from "@/features/admin/types";
import { useAdminGuard } from "@/features/admin/hooks/useAdminGuard";
import { useUsers } from "@/features/admin/hooks/useUsers";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { ProductsTab } from "@/features/admin/tabs/ProductsTab";
import { OrdersTab } from "@/features/admin/tabs/OrdersTab";
import { WarehouseTab } from "@/features/admin/tabs/WarehouseTab";
import { ReportsTab } from "@/features/admin/tabs/ReportsTab";
import { CategoriesTab } from "@/features/admin/tabs/CategoriesTab";
import { BannersTab } from "@/features/admin/tabs/BannersTab";
import { UsersTab } from "@/features/admin/tabs/UsersTab";

export default function AdminPage() {
	const router = useRouter();
	const user = useAdminGuard();
	const [activeTab, setActiveTab] = useState<AdminTab>("products");

	const isAdmin = user?.role === "ADMIN";
	// Loaded at page level: feeds the users tab and the sidebar badge.
	const { users, loading: usersLoading, reload: reloadUsers } = useUsers(isAdmin);

	if (!user) return null;

	function handleLogout() {
		logout();
		window.dispatchEvent(new Event("auth-changed"));
		router.push("/login");
	}

	const pendingUsersCount = users.filter((u) => u.status === "PENDING").length;

	return (
		<div className="adm">
			<AdminSidebar
				user={user}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				pendingUsersCount={pendingUsersCount}
				onLogout={handleLogout}
			/>

			<main className="adm-main">
				{activeTab === "products" && <ProductsTab user={user} />}
				{activeTab === "orders" && <OrdersTab isAdmin={isAdmin} />}
				{activeTab === "warehouse" && <WarehouseTab isAdmin={isAdmin} />}
				{activeTab === "reports" && <ReportsTab />}
				{activeTab === "categories" && isAdmin && <CategoriesTab />}
				{activeTab === "banners" && isAdmin && <BannersTab />}
				{activeTab === "users" && isAdmin && (
					<UsersTab users={users} loading={usersLoading} reload={reloadUsers} currentUserId={user.id} />
				)}
			</main>
		</div>
	);
}
