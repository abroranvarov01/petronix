"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import "./login.css";

export default function LoginPage() {
	const router = useRouter();
	const t = useT();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const res = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.message || t("login_error"));
				return;
			}

			localStorage.setItem("token", data.token);
			localStorage.setItem("user", JSON.stringify(data.user));
			window.dispatchEvent(new Event("auth-changed"));

			router.push("/admin");
		} catch {
			setError(t("login_net_err"));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="login-page">
			<div className="login-card">
				<div className="login-header">
					<img src="/favicon.png" alt="Logo" className="login-logo" />
					<h1>Petronix</h1>
					<p>{t("login_title")}</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<div className="login-field">
						<label>{t("login_email")}</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="email@example.com"
							required
						/>
					</div>

					<div className="login-field">
						<label>{t("login_pass")}</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={t("login_pass_ph")}
							required
						/>
					</div>

					{error && <div className="login-error">{error}</div>}

					<button type="submit" className="login-btn" disabled={loading}>
						{loading ? t("login_loading") : t("login_btn")}
					</button>
				</form>

				<p className="login-register-link">
					{t("login_no_acc")}{" "}
					<Link href="/register">{t("login_register")}</Link>
				</p>
			</div>
		</div>
	);
}
