"use client";

import { useRef } from "react";
import { IconClose } from "./Icons";

interface ModalProps {
	title: string;
	onClose: () => void;
	small?: boolean;
	children: React.ReactNode;
}

// Overlay + panel + header; closes on backdrop click.
export function Modal({ title, onClose, small, children }: ModalProps) {
	// Track where the press started so text selections that end on the
	// backdrop (after dragging out of the panel) don't close the modal.
	const downOnOverlay = useRef(false);
	return (
		<div
			className="adm-modal-overlay"
			onMouseDown={(e) => { downOnOverlay.current = e.target === e.currentTarget; }}
			onClick={(e) => { if (e.target === e.currentTarget && downOnOverlay.current) onClose(); }}
		>
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
