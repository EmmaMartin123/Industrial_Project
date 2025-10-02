"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

export default function ExamplePage() {
	const [open, setOpen] = useState(false);

	const handleAccept = () => {
		alert("Accepted!");
		setOpen(false);
	};

	return (
		<div className="p-8">
			<button
				onClick={() => setOpen(true)}
				className="px-4 py-2 bg-blue-600 text-white rounded-lg"
			>
				Open Modal
			</button>

			<Modal
				isOpen={open}
				onClose={() => setOpen(false)}
				onAccept={handleAccept}
				title="Confirm Action"
				message="Are you sure you want to continue?"
			/>
		</div>
	);
}

