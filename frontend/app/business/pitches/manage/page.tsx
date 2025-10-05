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
	
		  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			{pitches.map((pitch) => {
			  const progress = Math.min(
				(pitch.raised_amount / pitch.target_amount) * 100,
				100
			  );
	
			  return (
				<div
				  key={pitch.pitch_id}
				  className="card shadow-md bg-base-100 border border-base-300 overflow-hidden flex flex-col">
				  <div className="bg-gray-200 h-40 flex items-center justify-center text-gray-500 text-sm">
					Project Image
				  </div>
				  <div className="p-6 flex flex-col flex-grow">
					<h2 className="text-xl font-semibold mb-2">{pitch.title}</h2>
					<p className="text-sm text-gray-500 mb-4">{pitch.elevator_pitch}</p>
					{/* Progress Bar */}
					<div className="mb-3">
					  <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
						<div
						  className="bg-green-500 h-3"
						  style={{ width: `${progress}%` }}
						></div>
					  </div>
					  <p className="text-sm mt-1">
						<strong>£{pitch.raised_amount.toLocaleString()}</strong> raised of £
						{pitch.target_amount.toLocaleString()}
					  </p>
					</div>
	
					{/* Status and profit share */}
					<div className="flex justify-between items-center text-sm mb-4">
					  <span
						className={`px-2 py-1 rounded-md font-medium ${
						    pitch.status === "Active"
							? "bg-green-100 text-green-700"
							: pitch.status === "Funded"
							? "bg-blue-100 text-blue-700"
							: "bg-yellow-100 text-yellow-700"
						}`}
					  >
						{pitch.status}
					  </span>
					  <span className="text-gray-600">
						Profit Share: {pitch.profit_share_percent}%
					  </span>
					</div>
	
					{/* Actions */}
					<div className="mt-auto flex gap-2">
					  <button
						className={`${Button.buttonOutlineClassName} flex items-center gap-1 flex-1`}
						onClick={() => handleEdit(pitch.pitch_id)}
					  >
						<Pencil className="w-4 h-4" /> Edit
					  </button>
					  <button
						className={`${Button.buttonOutlineClassName} flex items-center gap-1 flex-1`}
						onClick={() => handleView(pitch.pitch_id)}
					  >
						<Eye className="w-4 h-4" /> View
					  </button>
					  {pitch.status === "Funded" && (
						<button
						  className="flex items-center gap-1 btn-outline btn-sm flex-1"
						  onClick={() => handleProfit(pitch.pitch_id)}
						>
						  <DollarSign className="w-4 h-4" /> Profit
						</button>
					  )}
					</div>
				  </div>
				</div>
			  );
			})}
		  </div>
		</div>
	);
}