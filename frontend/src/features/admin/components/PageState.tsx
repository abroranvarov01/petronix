"use client";

// Toolbar with page title/subtitle on the left and actions on the right.
export function AdminToolbar({ title, subtitle, children }: {
	title: string; subtitle?: string; children?: React.ReactNode;
}) {
	return (
		<div className="adm-toolbar">
			<div>
				<h1 className="adm-page-title">{title}</h1>
				{subtitle && <p className="adm-page-sub">{subtitle}</p>}
			</div>
			{children}
		</div>
	);
}

export function LoadingState() {
	return <div className="adm-loading"><div className="adm-spinner" />Yuklanmoqda...</div>;
}

export function EmptyState({ icon, text, children }: {
	icon?: React.ReactNode; text: string; children?: React.ReactNode;
}) {
	return (
		<div className="adm-empty">
			{icon}
			<p>{text}</p>
			{children}
		</div>
	);
}
