"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import "../login/login.css";

export default function RegisterPage() {
	const router = useRouter();
	const t = useT();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const res = await fetch(`${API_URL}/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.message || t("reg_error"));
				return;
			}

			// Self-registration is now pending admin approval — no auto-login.
			setSuccess(data.message || t("reg_pending"));
			setName("");
			setEmail("");
			setPassword("");
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
					<p>{t("reg_title")}</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<div className="login-field">
						<label>{t("reg_name")}</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t("reg_name_ph")}
							required
						/>
					</div>

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
							placeholder={t("reg_pass_ph")}
							minLength={6}
							required
						/>
					</div>

					{error && <div className="login-error">{error}</div>}
					{success && <div className="login-success">{success}</div>}

					<button type="submit" className="login-btn" disabled={loading}>
						{loading ? t("reg_loading") : t("reg_btn")}
					</button>
				</form>

				<p className="login-register-link">
					{t("reg_has_acc")}{" "}
					<Link href="/login">{t("reg_login")}</Link>
				</p>
			</div>
		</div>
	);
}
