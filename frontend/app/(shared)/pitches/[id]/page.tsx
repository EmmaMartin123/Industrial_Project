// app/business/pitches/[id]/page.tsx
"use client"; // Retained, as you use hooks (useState, useEffect, useRouter)

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import axiosInstance from "@/lib/axios";
import { Pitch, InvestmentTier } from "@/lib/types/pitch";
import * as Button from "@/components/Button";

// 1. UPDATE: Use the 'params' prop interface for dynamic routes
interface ViewPitchPageProps {
	params: Promise<{ id: string }>; // The dynamic segment [id] is accessed via params.id
}

// 2. UPDATE: Accept 'params' in the component signature
export default function ViewPitchPage({ params }: ViewPitchPageProps) {
	const router = useRouter();

	const resolved_params = use(params);

	const pitchId = Number(resolved_params.id);

	const [pitch, setPitch] = useState<Pitch | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// --- Data Fetching Effect ---
	useEffect(() => {
		// Validate the ID here based on the params value
		if (isNaN(pitchId) || pitchId <= 0) {
			setError("Invalid Pitch ID format in URL.");
			setLoading(false);
			return;
		}

		const fetchPitch = async () => {
			try {
				// Fetch the single pitch from the backend using the dynamic ID
				// RECOMMENDED: Use the clean path for the API if your backend supports it:
				const res = await axiosInstance.get(`/pitch?id=${pitchId}`);

				// The backend likely returns a single object.
				const pitchData = Array.isArray(res.data) ? res.data[0] : res.data;

				if (!pitchData) {
					setError("Pitch not found.");
					return;
				}

				// Map and clean up data types, especially Dates
				const mappedPitch: Pitch = {
					pitch_id: pitchData.id,
					title: pitchData.title,
					elevator_pitch: pitchData.elevator_pitch,
					detailed_pitch: pitchData.detailed_pitch,
					target_amount: pitchData.target_amount,
					raised_amount: pitchData.raised_amount ?? 0,
					profit_share_percent: pitchData.profit_share_percent,
					status: pitchData.status ?? "Active",
					investment_start_date: new Date(pitchData.investment_start_date),
					investment_end_date: new Date(pitchData.investment_end_date),
					created_at: new Date(pitchData.created_at ?? Date.now()),
					updated_at: new Date(pitchData.updated_at ?? Date.now()),
					investment_tiers: (pitchData.investment_tiers || []) as InvestmentTier[],
				};

				setPitch(mappedPitch);
			} catch (err: any) {
				console.error("Fetch pitch failed:", err);
				toast.error("Failed to load pitch details.");
				// Check if the error is a 404 (Not Found)
				if (err.response?.status === 404) {
					setError("Pitch not found.");
				} else {
					setError("Could not load pitch data due to a server error.");
				}
			} finally {
				setLoading(false);
			}
		};

		fetchPitch();
	}, [pitchId]);
	// The dependency array is correct, ensuring re-fetch if ID changes

	// --- Loading, Error, and Not Found States (No Change) ---
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader className="w-8 h-8 animate-spin text-primary" />
				<p className="ml-2">Loading pitch...</p>
			</div>
		);
	}

	if (error || !pitch) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
				<h1 className="text-2xl font-bold mb-4 text-error">Error</h1>
				<p className="mb-6">{error || "Pitch data not available."}</p>
				<button
					className={`${Button.buttonOutlineClassName}`}
					onClick={() => router.back()}
				>
					<ArrowLeft className="w-5 h-5 mr-2" /> Go Back
				</button>
			</div>
		);
	}
	// --- End States ---

	// Helper component for cleaner stat display
	const StatItem = ({ label, value }: { label: string, value: string | number }) => (
		<div className="flex justify-between p-3 border-b border-base-300 last:border-b-0">
			<span className="font-medium text-base-content/70">{label}:</span>
			<span className="font-semibold text-right">{value}</span>
		</div>
	);

	// --- Main Content Render (No Change) ---
	return (
		<div className="min-h-screen bg-base-100 p-4 md:p-8 max-w-4xl mx-auto">
			<button
				className={`flex items-center mb-6 ${Button.buttonOutlineClassName}`}
				onClick={() => router.back()}
			>
				<ArrowLeft className="w-5 h-5 mr-2" />
				Back to Pitches
			</button>

			<div className="bg-white p-6 shadow-xl rounded-lg">
				{/* Header Section */}
				<h1 className="text-4xl font-extrabold mb-2 text-primary">{pitch.title}</h1>
				<p className={`text-lg mb-4 italic text-base-content/80`}>
					"{pitch.elevator_pitch}"
				</p>

				{/* Detailed Pitch */}
				<section className="mb-8 border-t pt-6">
					<h2 className="text-2xl font-bold mb-3">The Detailed Pitch</h2>
					<p className="text-base leading-relaxed text-base-content/90">
						{pitch.detailed_pitch}
					</p>
				</section>

				{/* Key Metrics Grid */}
				<section className="mb-8 p-4 bg-base-200 rounded-lg shadow-inner grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
					<StatItem label="Status" value={pitch.status} />
					<StatItem label="Profit Share" value={`${pitch.profit_share_percent}%`} />
					<StatItem label="Target Investment" value={`£${pitch.target_amount.toLocaleString()}`} />
					<StatItem label="Raised Amount" value={`£${pitch.raised_amount.toLocaleString()}`} />
					<StatItem label="Investment Start" value={pitch.investment_start_date.toLocaleDateString()} />
					<StatItem label="Investment End" value={pitch.investment_end_date.toLocaleDateString()} />
				</section>

				{/* Investment Tiers */}
				{pitch.investment_tiers && pitch.investment_tiers.length > 0 && (
					<section className="mb-8">
						<h2 className="text-2xl font-bold mb-4">Investment Tiers</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{pitch.investment_tiers.map((tier: InvestmentTier) => (
								<div
									// 💡 THE FIX: Apply the unique key here
									key={tier.tier_id}
									className="p-5 border-2 border-primary/20 rounded-xl bg-primary/5 shadow-md hover:shadow-lg transition-shadow"
								>
									<h3 className="text-lg font-bold mb-1 text-primary">{tier.name}</h3>
									<p className="text-sm text-base-content/80">
										Min Investment: <span className="font-semibold">£{tier.min_amount.toLocaleString()}</span>
									</p>
									{tier.max_amount && (
										<p className="text-sm text-base-content/80">
											Max Investment: <span className="font-semibold">£{tier.max_amount.toLocaleString()}</span>
										</p>
									)}
									<p className="text-sm text-base-content/80 mt-1">
										Multiplier: <span className="font-semibold text-lg text-secondary">{tier.multiplier}x</span>
									</p>
								</div>
							))}
						</div>
					</section>
				)}

				{/* Call to Action (Example) */}
				<div className="mt-8 pt-6 border-t flex justify-end">
					<button
						className={`${Button.buttonClassName}`}
						onClick={() => {/* Handle investment modal or page navigation */ }}
					>
						Invest Now
					</button>
				</div>
			</div>
		</div>
	);
}
