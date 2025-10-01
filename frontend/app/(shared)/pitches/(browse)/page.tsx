"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { Pitch, InvestmentTier } from "@/lib/types/pitch"; // adjust path if needed
import * as Button from "@/components/Button";

import { useAuthStore } from "@/lib/store/authStore";
import { supabase } from "@/lib/supabaseClient";

export default function BusinessPitchesPage() {
	const router = useRouter();
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);

	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth();
		};
		verifyAuth();
	}, [checkAuth]);

	// redirect if not logged in
	useEffect(() => {
		if (!isCheckingAuth && !authUser) {
			router.push("/login");
		}
	}, [authUser, isCheckingAuth, router]);

	// fetch pitches from backend
	useEffect(() => {
		const fetchPitches = async () => {
			try {
				// Fetches data from the /pitch endpoint
				const res = await axiosInstance.get("/pitch");

				// check if the response is an array or a single object
				let dataToMap = res.data;

				// if response data is not an array but is a non null object then 
				// wrap it in an array so that .map() can be called on it
				if (!Array.isArray(dataToMap) && dataToMap !== null && typeof dataToMap === 'object') {
					dataToMap = [dataToMap];
				} else if (!Array.isArray(dataToMap)) {
					// if it's neither an array nor a single object
					dataToMap = [];
				}
				// -------------------------------------------------------------------

				// map backend data to pitch type
				const mappedPitches: Pitch[] = dataToMap.map((p: any) => ({
					pitch_id: p.id,
					title: p.title,
					elevator_pitch: p.elevator_pitch,
					detailed_pitch: p.detailed_pitch,
					target_amount: p.target_amount,
					raised_amount: p.raised_amount ?? 0,
					profit_share_percent: p.profit_share_percent,
					status: p.status ?? "Active",
					investment_start_date: new Date(p.investment_start_date),
					investment_end_date: new Date(p.investment_end_date),
					created_at: new Date(p.created_at ?? Date.now()),
					updated_at: new Date(p.updated_at ?? Date.now()),
					investment_tiers: p.investment_tiers as InvestmentTier[]
				}));

				setPitches(mappedPitches);
			} catch (err: any) {
				console.error(err);
				toast.error("Failed to load pitches");
			} finally {
				setLoading(false);
			}
		};

		fetchPitches();
	}, []);

	const handleView = (pitchId: number) => {
		router.push(`/pitches/${pitchId}`);
	};

	// show loader while checking auth or loading pitches
	if (isCheckingAuth || !authUser || loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader className="w-10 h-10 animate-spin" />
			</div>
		);
	}

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
