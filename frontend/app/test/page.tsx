"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

export default function ExamplePage() {
	const [open, setOpen] = useState(false);

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
				title="Choose an option"
				message="67"
				buttons={[
					{
						label: "Cancel",
						onClick: () => setOpen(false),
					},
					{
						label: "Accept",
						onClick: () => {
							alert("Accepted!");
							setOpen(false);
						},
						className: "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700",
					},
					{
						label: "Extra",
						onClick: () => alert("Extra clicked!"),
						className: "px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700",
					},
				]}
			/>
		</div>
	);
}
