// Reusable stroke icons (Feather-style) used across admin screens.

interface IconProps {
	size?: number;
	strokeWidth?: number;
}

function Svg({ size = 18, strokeWidth = 2, children }: IconProps & { children: React.ReactNode }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
			{children}
		</svg>
	);
}

export function IconPackage(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
			<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
			<line x1="12" y1="22.08" x2="12" y2="12" />
		</Svg>
	);
}

export function IconPackageOutline(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
		</Svg>
	);
}

export function IconCart(props: IconProps) {
	return (
		<Svg {...props}>
			<circle cx="9" cy="21" r="1" />
			<circle cx="20" cy="21" r="1" />
			<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
		</Svg>
	);
}

export function IconWarehouse(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M3 21V8l9-5 9 5v13" />
			<path d="M3 21h18" />
			<rect x="7" y="13" width="10" height="8" />
		</Svg>
	);
}

export function IconChart(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M3 3v18h18" />
			<rect x="7" y="10" width="3" height="7" />
			<rect x="12" y="6" width="3" height="11" />
			<rect x="17" y="13" width="3" height="4" />
		</Svg>
	);
}

export function IconGrid(props: IconProps) {
	return (
		<Svg {...props}>
			<rect x="3" y="3" width="7" height="7" />
			<rect x="14" y="3" width="7" height="7" />
			<rect x="14" y="14" width="7" height="7" />
			<rect x="3" y="14" width="7" height="7" />
		</Svg>
	);
}

export function IconImage(props: IconProps) {
	return (
		<Svg {...props}>
			<rect x="2" y="4" width="20" height="16" rx="2" />
			<circle cx="8" cy="10" r="2" />
			<path d="M2 17l5-5 4 4 5-5 6 6" />
		</Svg>
	);
}

export function IconUsers(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</Svg>
	);
}

export function IconLogout(props: IconProps) {
	return (
		<Svg size={16} {...props}>
			<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
			<polyline points="16 17 21 12 16 7" />
			<line x1="21" y1="12" x2="9" y2="12" />
		</Svg>
	);
}

export function IconSearch(props: IconProps) {
	return (
		<Svg size={16} {...props}>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</Svg>
	);
}

export function IconPlus(props: IconProps) {
	return (
		<Svg strokeWidth={2.5} {...props}>
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</Svg>
	);
}

export function IconClose(props: IconProps) {
	return (
		<Svg size={20} {...props}>
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</Svg>
	);
}

export function IconEdit(props: IconProps) {
	return (
		<Svg size={15} {...props}>
			<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
			<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
		</Svg>
	);
}

export function IconTrash(props: IconProps) {
	return (
		<Svg size={15} {...props}>
			<polyline points="3 6 5 6 21 6" />
			<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
		</Svg>
	);
}

export function IconDrag({ size = 14 }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
			<circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
			<circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
			<circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
		</svg>
	);
}
