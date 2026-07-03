"use client";

import { IconClose } from "./Icons";

interface ModalProps {
	title: string;
	onClose: () => void;
	small?: boolean;
	children: React.ReactNode;
}

// Overlay + panel + header; closes on backdrop click.
export function Modal({ title, onClose, small, children }: ModalProps) {
	return (
		<div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
			<div className={`adm-modal${small ? " adm-modal-sm" : ""}`}>
				<div className="adm-modal-header">
					<h2>{title}</h2>
					<button className="adm-modal-close" onClick={onClose}>
						<IconClose />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
