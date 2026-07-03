"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/auth";
import type { AuthUser } from "../types";

// Redirects to /login when there is no session; returns the user once known.
export function useAdminGuard(): AuthUser | null {
	const router = useRouter();
	const [user, setUser] = useState<AuthUser | null>(null);

	useEffect(() => {
		const token = getToken();
		const u = getUser();
		if (!token || !u) { router.push("/login"); return; }
		setUser(u);
	}, [router]);

	return user;
}
