// Client-side CSV export (BOM prefix so Excel opens it as UTF-8).
export function exportCsv(headers: string[], rows: (string | number)[][], filename: string) {
	const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
	const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = filename;
	a.click();
}
