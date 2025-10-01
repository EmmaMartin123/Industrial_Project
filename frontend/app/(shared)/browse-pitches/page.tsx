"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Pitch, InvestmentTier } from "@/lib/types/pitch"; // adjust path if needed
import * as Button from "@/components/Button";

import { useAuthStore } from "@/lib/store/authStore";

export default function BusinessPitchesPage() {
	const router = useRouter();
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);

	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">All Pitches</h1>

			{pitches.length === 0 ? (
				<p>No pitches available.</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{pitches.map((pitch, index) => (
						<div
							key={pitch.pitch_id ?? `pitch-${index}`}
							className="card bg-base-100 shadow-lg p-6 flex flex-col justify-between"
						>
							<div>
								<h2 className="text-xl font-semibold mb-2">{pitch.title}</h2>
								<p className="opacity-70 mb-1">Status: {pitch.status}</p>
								<p className="opacity-70 mb-1">
									Raised: £{pitch.raised_amount} / £{pitch.target_amount}
								</p>
								<p className="opacity-70">
									Profit Share: {pitch.profit_share_percent}%
								</p>
							</div>
							<div className="mt-4 flex justify-end">
								<button
									className={`${Button.buttonOutlineClassName}`}
									onClick={() => handleView(pitch.pitch_id)}
								>
									<Eye /> View
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
