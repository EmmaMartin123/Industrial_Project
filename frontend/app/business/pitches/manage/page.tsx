"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, Eye, DollarSign } from "lucide-react";
import { mockPitches } from "@/lib/mockPitches";
import * as Button from "@/components/Button";

export default function ManagePitchesPage() {
	const router = useRouter();
	const [pitches, setPitches] = useState(mockPitches);

	const handleEdit = (pitchId: number) => {
		// Only allow editing if status is Draft or Active
		const pitch = pitches.find((p) => p.pitch_id === pitchId);
		if (pitch?.status === "Funded") {
			toast.error("Cannot edit a funded pitch");
			return;
		}
		router.push(`/business/manage-pitches/${pitchId}/edit`);
	};

	const handleView = (pitchId: number) => {
		router.push(`/business/manage-pitches?pitchId=${pitchId}`);
	};

	const handleProfit = (pitchId: number) => {
		router.push(`/business/profit-distribution?pitchId=${pitchId}`);
	};

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">Manage Pitches</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{pitches.map((pitch) => (
					<div key={pitch.pitch_id} className="card shadow-lg bg-base-100 p-6 flex flex-col justify-between">
						<div>
							<h2 className="text-xl font-semibold mb-2">{pitch.title}</h2>
							<p className="opacity-70 mb-1">Status: {pitch.status}</p>
							<p className="opacity-70 mb-1">
								Raised: £{pitch.raised_amount} / £{pitch.target_amount}
							</p>
							<p className="opacity-70">Profit Share: {pitch.profit_share_percent}%</p>
						</div>
						<div className="mt-4 flex flex-wrap gap-2">
							<button
								className={`${Button.buttonOutlineClassName}`}
								onClick={() => handleEdit(pitch.pitch_id)}
							>
								<Pencil /> Edit
							</button>
							<button
								className={`${Button.buttonOutlineClassName}`}
								onClick={() => handleView(pitch.pitch_id)}
							>
								<Eye /> View
							</button>
							{pitch.status === "Funded" && (
								<button
									className="flex items-center gap-1 btn-outline btn-sm"
									onClick={() => handleProfit(pitch.pitch_id)}
								>
									<DollarSign /> Distribute Profit
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
