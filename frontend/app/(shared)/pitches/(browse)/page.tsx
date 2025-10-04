"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Pitch, InvestmentTier } from "@/lib/types/pitch";
import { getAllPitches } from "@/lib/api/pitch";
import { useAuthStore } from "@/lib/store/authStore";
import { LoaderPinwheel } from "lucide-react";

export default function BusinessPitchesPage() {
	const router = useRouter();
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);

	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	// auth check
	useEffect(() => {
		const verifyAuth = async () => await checkAuth();
		verifyAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!isCheckingAuth && !authUser) router.push("/login");
	}, [authUser, isCheckingAuth, router]);

	// fetch pitches
	useEffect(() => {
		if (isCheckingAuth || !authUser) return;

		const fetchPitches = async () => {
			try {
				setLoading(true);
				const fetchedData = await getAllPitches();

				let dataToMap = Array.isArray(fetchedData) ? fetchedData : [];

				const mappedPitches: Pitch[] = dataToMap.map((p: any) => ({
					pitch_id: p.id,
					title: p.title,
					elevator_pitch: p.elevator_pitch,
					detailed_pitch: p.detailed_pitch,
					target_amount: p.target_amount,
					raised_amount: p.raised_amount ?? 0,
					profit_share_percent: p.profit_share_percent,
					status: p.status,
					investment_start_date: new Date(p.investment_start_date),
					investment_end_date: new Date(p.investment_end_date),
					created_at: new Date(p.created_at ?? Date.now()),
					updated_at: new Date(p.updated_at ?? Date.now()),
					investment_tiers: p.investment_tiers as InvestmentTier[],
				}));

				setPitches(mappedPitches);
			} catch (err) {
				console.error(err);
				toast.error("Failed to load pitches");
				setPitches([]);
			} finally {
				setLoading(false);
			}
		};

		fetchPitches();
	}, [authUser, isCheckingAuth]);

	if (isCheckingAuth || !authUser || loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<LoaderPinwheel className="w-10 h-10 animate-spin" />
			</div>
		);
	}

	const handleView = (pitchId: number) => {
		router.push(`/pitches/${pitchId}`);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-7xl mx-auto">
				{/* header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white">All Pitches</h1>
					<p className="text-gray-600 dark:text-gray-400 mt-2 md:mt-0">
						Explore all pitches available on the platform.
					</p>
				</div>

				{pitches.length === 0 ? (
					<p className="text-gray-600 dark:text-gray-400">No pitches available.</p>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{pitches.map((pitch, index) => (
							<div
								key={pitch.pitch_id ?? `pitch-${index}`}
								className="group cursor-pointer bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-primary/50 transition-all duration-200 flex flex-col"
								onClick={() => handleView(pitch.pitch_id)}
							>
								{/* full-width thumbnail */}
								<div className="w-full relative overflow-hidden bg-gray-200 dark:bg-gray-700">
									<div className="pt-[56.25%] flex items-center justify-center">
										{/* 16:9 placeholder */}
										<span className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
											Thumbnail
										</span>
									</div>
								</div>

								<div className="p-6 flex flex-col justify-between">
									<h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition">
										{pitch.title}
									</h2>
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
										<span className="font-medium text-gray-800 dark:text-gray-200">Status:</span>{" "}
										<span
											className={`${pitch.status === "Funded"
												? "text-green-600 dark:text-green-400"
												: pitch.status === "Draft"
													? "text-gray-500"
													: "text-yellow-600 dark:text-yellow-400"
												}`}
										>
											{pitch.status}
										</span>
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
										<span className="font-medium text-gray-800 dark:text-gray-200">Raised:</span> £
										{pitch.raised_amount} / £{pitch.target_amount}
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										<span className="font-medium text-gray-800 dark:text-gray-200">Profit Share:</span>{" "}
										{pitch.profit_share_percent}%
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
