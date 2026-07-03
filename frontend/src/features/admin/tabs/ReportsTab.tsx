"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { exportCsv } from "../csv";
import { AdminToolbar, EmptyState, LoadingState } from "../components/PageState";

type ReportType = "sales" | "stock" | "profit" | "turnover";

const REPORT_TABS: [ReportType, string][] = [
	["sales", "Sotuvlar"], ["stock", "Qoldiqlar"], ["profit", "Foyda"], ["turnover", "Aylanma"],
];

export function ReportsTab() {
	const todayStr = new Date().toISOString().slice(0, 10);
	const monthAgoStr = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

	const [reportType, setReportType] = useState<ReportType>("sales");
	const [repFrom, setRepFrom] = useState(monthAgoStr);
	const [repTo, setRepTo] = useState(todayStr);
	const [turnoverBy, setTurnoverBy] = useState<"category" | "dealer">("category");
	// Shape depends on the report endpoint, so it stays untyped.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [reportData, setReportData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		let url = "";
		if (reportType === "sales") url = `${API_URL}/reports/sales?from=${repFrom}&to=${repTo}&groupBy=day`;
		else if (reportType === "profit") url = `${API_URL}/reports/profit?from=${repFrom}&to=${repTo}`;
		else if (reportType === "turnover") url = `${API_URL}/reports/turnover?from=${repFrom}&to=${repTo}&by=${turnoverBy}`;
		else url = `${API_URL}/reports/stock`;
		fetch(url, { headers: authHeaders() })
			.then((r) => r.json())
			.then((data) => { if (!cancelled) setReportData(data); })
			.catch(() => { if (!cancelled) setReportData(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reportType, repFrom, repTo, turnoverBy]);

	return (
		<>
			<AdminToolbar title="Hisobotlar" subtitle="1C uslubidagi hisobotlar" />

			<div className="adm-rep-controls">
				<div className="adm-rep-tabs">
					{REPORT_TABS.map(([k, label]) => (
						<button key={k} className={`adm-rep-tab${reportType === k ? " active" : ""}`} onClick={() => { setReportType(k); setReportData(null); }}>{label}</button>
					))}
				</div>
				{reportType !== "stock" && (
					<div className="adm-rep-dates">
						<input type="date" value={repFrom} onChange={(e) => setRepFrom(e.target.value)} />
						<span>—</span>
						<input type="date" value={repTo} onChange={(e) => setRepTo(e.target.value)} />
						{reportType === "turnover" && (
							<select value={turnoverBy} onChange={(e) => setTurnoverBy(e.target.value as "category" | "dealer")}>
								<option value="category">Kategoriya bo'yicha</option>
								<option value="dealer">Diler bo'yicha</option>
							</select>
						)}
					</div>
				)}
			</div>

			{loading ? (
				<LoadingState />
			) : !reportData ? (
				<EmptyState text="Ma'lumot yo'q" />
			) : (
				<>
					{reportType === "sales" && (
						<>
							<div className="adm-rep-cards">
								<div className="adm-rep-card"><span>Tushum</span><strong>${(reportData.totals?.revenue ?? 0).toFixed(2)}</strong></div>
								<div className="adm-rep-card"><span>Buyurtmalar</span><strong>{reportData.totals?.orders ?? 0}</strong></div>
								<div className="adm-rep-card"><span>O'rtacha chek</span><strong>${(reportData.totals?.avgCheck ?? 0).toFixed(2)}</strong></div>
							</div>
							{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
							<button className="adm-link-btn" onClick={() => exportCsv(["Sana", "Tushum", "Buyurtma", "Soni"], reportData.rows.map((r: any) => [r.period, r.revenue, r.orders, r.qty]), "sales.csv")}>⬇ CSV</button>
							<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Sana</th><th>Tushum</th><th>Buyurtmalar</th><th>Soni</th></tr></thead>
								{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
								<tbody>{reportData.rows.length === 0 ? <tr><td colSpan={4} className="adm-muted">Sotuvlar yo'q</td></tr> : reportData.rows.map((r: any) => (
									<tr key={r.period}><td>{r.period}</td><td className="adm-table-price">${r.revenue.toFixed(2)}</td><td>{r.orders}</td><td>{r.qty}</td></tr>
								))}</tbody></table></div>
						</>
					)}

					{reportType === "profit" && (
						<>
							<div className="adm-rep-cards">
								<div className="adm-rep-card"><span>Tushum</span><strong>${(reportData.totals?.revenue ?? 0).toFixed(2)}</strong></div>
								<div className="adm-rep-card"><span>Tannarx</span><strong>${(reportData.totals?.cost ?? 0).toFixed(2)}</strong></div>
								<div className="adm-rep-card"><span>Foyda</span><strong className="adm-danger" style={{ color: "#22c55e" }}>${(reportData.totals?.profit ?? 0).toFixed(2)}</strong></div>
								<div className="adm-rep-card"><span>Margin</span><strong>{(reportData.totals?.margin ?? 0).toFixed(1)}%</strong></div>
							</div>
							{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
							<button className="adm-link-btn" onClick={() => exportCsv(["Mahsulot", "Tushum", "Tannarx", "Foyda", "Soni"], reportData.rows.map((r: any) => [r.name, r.revenue, r.cost, r.profit, r.qty]), "profit.csv")}>⬇ CSV</button>
							<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mahsulot</th><th>Tushum</th><th>Tannarx</th><th>Foyda</th><th>Soni</th></tr></thead>
								{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
								<tbody>{reportData.rows.length === 0 ? <tr><td colSpan={5} className="adm-muted">Ma'lumot yo'q</td></tr> : reportData.rows.map((r: any, i: number) => (
									<tr key={i}><td>{r.name}</td><td>${r.revenue.toFixed(2)}</td><td>${r.cost.toFixed(2)}</td><td className="adm-table-price">${r.profit.toFixed(2)}</td><td>{r.qty}</td></tr>
								))}</tbody></table></div>
						</>
					)}

					{reportType === "turnover" && (
						<>
							{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
							<button className="adm-link-btn" onClick={() => exportCsv([turnoverBy === "dealer" ? "Diler" : "Kategoriya", "Tushum", "Soni"], reportData.rows.map((r: any) => [r.label, r.revenue, r.qty]), "turnover.csv")}>⬇ CSV</button>
							<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>{turnoverBy === "dealer" ? "Diler" : "Kategoriya"}</th><th>Tushum</th><th>Soni</th></tr></thead>
								{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
								<tbody>{reportData.rows.length === 0 ? <tr><td colSpan={3} className="adm-muted">Ma'lumot yo'q</td></tr> : reportData.rows.map((r: any, i: number) => (
									<tr key={i}><td>{r.label}</td><td className="adm-table-price">${r.revenue.toFixed(2)}</td><td>{r.qty}</td></tr>
								))}</tbody></table></div>
						</>
					)}

					{reportType === "stock" && (
						<>
							<div className="adm-rep-cards">
								<div className="adm-rep-card"><span>Pozitsiyalar</span><strong>{reportData.totals?.positions ?? 0}</strong></div>
								<div className="adm-rep-card"><span>Jami soni</span><strong>{reportData.totals?.totalQty ?? 0}</strong></div>
								<div className="adm-rep-card"><span>Qoldiq qiymati</span><strong>${(reportData.totals?.totalValue ?? 0).toFixed(2)}</strong></div>
								<div className="adm-rep-card"><span>Kam qoldiq</span><strong className="adm-danger">{reportData.low?.length ?? 0}</strong></div>
							</div>
							{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
							<button className="adm-link-btn" onClick={() => exportCsv(["Mahsulot", "Qoldiq", "Tannarx", "Qiymat"], reportData.items.map((r: any) => [r.name, r.quantity, r.costPrice, r.value]), "stock.csv")}>⬇ CSV</button>
							<div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Mahsulot</th><th>Qoldiq</th><th>Tannarx</th><th>Qiymat</th></tr></thead>
								{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
								<tbody>{reportData.items.length === 0 ? <tr><td colSpan={4} className="adm-muted">Qoldiqlar yo'q</td></tr> : reportData.items.map((r: any, i: number) => (
									<tr key={i}><td>{r.name}</td><td>{r.quantity} {r.unit}</td><td>${r.costPrice}</td><td className="adm-table-price">${r.value.toFixed(2)}</td></tr>
								))}</tbody></table></div>
						</>
					)}
				</>
			)}
		</>
	);
}
