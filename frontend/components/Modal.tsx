"use client";

import React from "react";

interface ModalButton {
	label: string;
	onClick: () => void;
	className?: string; // optional styling override
}

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	message: string;
	buttons: ModalButton[];
}

export default function Modal({ isOpen, onClose, title, message, buttons }: ModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
			<div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
				{title && <h2 className="text-lg font-bold mb-2">{title}</h2>}
				<p className="mb-6">{message}</p>
				<div className="flex justify-end gap-3">
					{buttons.map((btn, index) => (
						<button
							key={index}
							onClick={btn.onClick}
							className={
								btn.className ??
								"px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
							}
						>
							{btn.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
