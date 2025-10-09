"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "@/lib/axios";
import { Pitch } from "@/lib/types/pitch";
import LoaderComponent from "@/components/Loader";
import { toast } from "sonner";
import { getPitchById } from "@/lib/api/pitch";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "@/lib/api/profile";

export default function InvestPage() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const router = useRouter();
	const params = useParams();
	const pitchId = Number(params?.id);

	const [pitch, setPitch] = useState<Pitch | null>(null);
	const [loading, setLoading] = useState(true);
	const [amount, setAmount] = useState<number>(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userProfile, setUserProfile] = useState<any>(null);

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
			router.push("/");
		}
	}, [authUser, isCheckingAuth, router]);

	// fetch user profile
	useEffect(() => {
		const fetchProfile = async () => {
			if (authUser?.id) {
				try {
					const profile = await getUserProfile(authUser.id);
					setUserProfile(profile);
				} catch (err) {
					console.error("Failed to fetch user profile:", err);
				}
			}
		};
		fetchProfile();
	}, [authUser?.id]);

	// fetch pitch
	useEffect(() => {
		if (isNaN(pitchId) || pitchId <= 0) {
			setLoading(false);
			return;
		}

		const fetchPitch = async () => {
			try {
				const data = await getPitchById(pitchId);
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

	const handleSubmit = async () => {
		if (!amount || amount <= 0) {
			toast.error("Enter a valid investment amount.");
			return;
		}

		if (!userProfile?.dashboard_balance || amount > userProfile.dashboard_balance) {
			toast.error("Insufficient balance to make this investment.");
			return;
		}

		setIsSubmitting(true);
		try {
			await axios.post("/investment", {
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
			<div className="space-y-2 text-center">
				<h1 className="text-4xl font-extrabold">{pitch.title}</h1>
				<p className="text-gray-600 text-lg">{pitch.elevator_pitch}</p>
			</div>

			<div className="bg-white rounded-xl p-6 space-y-6 border border-gray-100">
				<h2 className="text-2xl font-semibold text-gray-800">Investment Tiers</h2>

				<div className="grid gap-4 md:grid-cols-2">
					{pitch.investment_tiers?.map((tier) => {
						const isAmountInTier =
							amount >= tier.min_amount

						return (
							<div
								key={tier.tier_id}
								className={`p-4 border rounded-lg flex flex-col justify-between transition-all duration-200
									${isAmountInTier
										? "border-blue-500 bg-blue-50 shadow-md"
										: "border-gray-200 bg-white"
									}`}
							>
								<p className="font-semibold text-gray-900">{tier.name}</p>
								<p className="text-sm text-gray-500 mt-1">
									Min: £{tier.min_amount} | Max: £{tier.max_amount ?? "∞"} | Multiplier: {tier.multiplier}x
								</p>
							</div>
						);
					})}
				</div>

				<div className="space-y-2">
					<label className="block font-medium text-gray-700">
						Investment Amount (£)
					</label>
					<input
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={amount === 0 ? "" : amount}
						onChange={(e) => {
							const val = e.target.value.replace(/[^0-9]/g, "");
							setAmount(val === "" ? 0 : Number(val));
						}}
						className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
						placeholder="Enter your investment amount"
					/>
				</div>

				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || amount <= 0}
					className="w-full"
				>
					{isSubmitting ? "Processing..." : "Invest Now"}
				</Button>
			</div>
		</div>
	);
}
