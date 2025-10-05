"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "@/lib/axios";
import { Pitch, InvestmentTier, PitchMedia } from "@/lib/types/pitch";
import LoaderComponent from "@/components/Loader";
import { toast } from "sonner";
import { getPitchById } from "@/lib/api/pitch";
import { useAuthStore } from "@/lib/store/authStore";

export default function InvestPage() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	const router = useRouter();
	const params = useParams();
	const pitchId = Number(params?.id);

	const [pitch, setPitch] = useState<Pitch | null>(null);
	const [loading, setLoading] = useState(true);
	const [amount, setAmount] = useState<number>(0);
	const [selectedTier, setSelectedTier] = useState<InvestmentTier | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// redirect if already logged in
	useEffect(() => {
		if (authUser) {
			router.push("/")
		}
	}, [authUser, router])

	// fetch pitch data
	useEffect(() => {
		if (isNaN(pitchId) || pitchId <= 0) {
			setLoading(false);
			return;
		}

		const fetchPitch = async () => {
			try {
				const data = await getPitchById(pitchId);

				console.log(data);
				setPitch(data);
			} catch (err: any) {
				console.error("Fetch pitch failed:", err);
				toast.error("Failed to load pitch details.");
			} finally {
				setLoading(false);
			}
		};

		fetchPitch();
	}, [pitchId]);

	if (loading) return <LoaderComponent />;

	if (!pitch) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
				<p className="text-red-500 text-lg font-semibold mb-4">Pitch not found.</p>
				<button
					className="btn btn-outline btn-md px-6"
					onClick={() => router.back()}
				>
					Go Back
				</button>
			</div>
		);
	}

	const handleTierSelect = (tier: InvestmentTier) => {
		setSelectedTier(tier);
		setAmount(tier.min_amount);
	};

	const handleSubmit = async () => {
		if (!amount || amount <= 0) {
			toast.error("Enter a valid investment amount.");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await axios.post("/investment", {
				pitch_id: pitch.id,
				amount,
			});
			toast.success("Investment successful!");
			router.push(`/pitches/${pitch.id}`);
		} catch (err: any) {
			console.error(err);
			if (err.response?.status === 402) {
				toast.error("Insufficient funds.");
			} else if (err.response?.data) {
				toast.error(err.response.data);
			} else {
				toast.error("Investment failed.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-8 space-y-8">
			{/* Pitch Header */}
			<div className="space-y-2 text-center">
				<h1 className="text-4xl font-extrabold">{pitch.title}</h1>
				<p className="text-gray-600 text-lg">{pitch.elevator_pitch}</p>
			</div>

			{/* Investment Section */}
			<div className="bg-white shadow-md rounded-xl p-6 space-y-6 border border-gray-100">
				<h2 className="text-2xl font-semibold text-gray-800">Select Investment Tier</h2>

				{/* Tiers */}
				<div className="grid gap-4 md:grid-cols-2">
					{pitch.investment_tiers?.map((tier) => (
						<div
							key={tier.tier_id}
							onClick={() => handleTierSelect(tier)}
							className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-between ${selectedTier?.tier_id === tier.tier_id
									? "border-blue-500 bg-blue-50 shadow-md"
									: "border-gray-200 hover:bg-gray-50 hover:shadow-sm"
								}`}
						>
							<div>
								<p className="font-semibold text-gray-900">{tier.name}</p>
								<p className="text-sm text-gray-500 mt-1">
									Min: £{tier.min_amount} | Max: £{tier.max_amount ?? "∞"} | Multiplier: {tier.multiplier}x
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Amount Input */}
				<div className="space-y-2">
					<label className="block font-medium text-gray-700">Investment Amount (£)</label>
					<input
						type="number"
						value={amount}
						min={selectedTier?.min_amount ?? 1}
						max={selectedTier?.max_amount ?? undefined}
						onChange={(e) => setAmount(Number(e.target.value))}
						className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
						placeholder="Enter your investment amount"
					/>
				</div>

				{/* Submit Button */}
				<button
					onClick={handleSubmit}
					disabled={isSubmitting || !selectedTier}
					className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${isSubmitting || !selectedTier
							? "bg-gray-400 cursor-not-allowed"
							: "bg-blue-600 hover:bg-blue-700"
						}`}
				>
					{isSubmitting ? "Processing..." : "Invest Now"}
				</button>
			</div>
		</div>
	);
}
