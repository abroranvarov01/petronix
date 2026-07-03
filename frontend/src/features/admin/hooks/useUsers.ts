"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { AdminUser } from "../types";

// Users live at page level: the list feeds the users tab and the
// pending-count badge in the sidebar at the same time.
export function useUsers(enabled: boolean) {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(false);

	const reload = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
			setUsers(res.ok ? await res.json() : []);
		} catch { setUsers([]); }
		finally { setLoading(false); }
	}, []);

	useEffect(() => {
		if (enabled) reload();
	}, [enabled, reload]);

	return { users, loading, reload };
}
