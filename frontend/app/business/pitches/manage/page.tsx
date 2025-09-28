"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import toast from "react-hot-toast";
import { Pencil, Eye, DollarSign } from "lucide-react";

const mockPitches = [
	{
		id: 1,
		title: "pitch 1",
		status: "Active",
		raised: 4500,
		target: 10000,
		profitShare: 20,
	},
	{
		id: 2,
		title: "pitch 2",
		status: "Funded",
		raised: 12000,
		target: 12000,
		profitShare: 15,
	},
	{
		id: 3,
		title: "pitch 3",
		status: "Draft",
		raised: 0,
		target: 8000,
		profitShare: 25,
	},
];

export default function ManagePitchesPage() {
	const router = useRouter();
	const [pitches, setPitches] = useState(mockPitches);

	const handleEdit = (pitchId: number) => {
		// Only allow editing if status is Draft or Active
		const pitch = pitches.find((p) => p.id === pitchId);
		if (pitch?.status === "Funded") {
			toast.error("Cannot edit a funded pitch");
			return;
		}
		router.push(`/business/manage-pitches/${pitchId}/edit`);
	};

	const handleView = (pitchId: number) => {
		router.push(`/business/manage-pitches/${pitchId}`);
	};

	const handleProfit = (pitchId: number) => {
		router.push(`/business/profit-distribution/${pitchId}`);
	};

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">Manage Pitches</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{pitches.map((pitch) => (
					<div key={pitch.id} className="card shadow-lg bg-base-100 p-6 flex flex-col justify-between">
						<div>
							<h2 className="text-xl font-semibold mb-2">{pitch.title}</h2>
							<p className="opacity-70 mb-1">Status: {pitch.status}</p>
							<p className="opacity-70 mb-1">
								Raised: £{pitch.raised} / £{pitch.target}
							</p>
							<p className="opacity-70">Profit Share: {pitch.profitShare}%</p>
						</div>
						<div className="mt-4 flex flex-wrap gap-2">
							<Button
								className="flex items-center gap-1 btn-sm"
								onClick={() => handleEdit(pitch.id)}
							>
								<Pencil /> Edit
							</Button>
							<Button
								className="flex items-center gap-1 btn-outline btn-sm"
								onClick={() => handleView(pitch.id)}
							>
								<Eye /> View
							</Button>
							{pitch.status === "Funded" && (
								<Button
									className="flex items-center gap-1 btn-success btn-sm"
									onClick={() => handleProfit(pitch.id)}
								>
									<DollarSign /> Distribute Profit
								</Button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
