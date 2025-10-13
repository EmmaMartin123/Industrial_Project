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
	// parse pitch id from url parameters
	const pitchId = Number(params?.id);

	// state for pitch details, loading, investment amount, and user data
	const [pitch, setPitch] = useState<Pitch | null>(null);
	const [loading, setLoading] = useState(true);
	const [amount, setAmount] = useState<number>(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userProfile, setUserProfile] = useState<any>(null);

	// auth check on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth();
		};
		verifyAuth();
	}, [checkAuth]);

	// redirect if user is not authenticated after checking
	useEffect(() => {
		if (!isCheckingAuth && !authUser) {
			router.push("/");
		}
	}, [authUser, isCheckingAuth, router]);

	// fetch user profile (to get dashboard balance)
	useEffect(() => {
		const fetchProfile = async () => {
			if (authUser?.id) {
				try {
					const profile = await getUserProfile(authUser.id);
					setUserProfile(profile);
				} catch (err) {
					console.error("failed to fetch user profile:", err);
				}
			}
		};
		fetchProfile();
	}, [authUser?.id]);

	// fetch specific pitch details using pitchId
	useEffect(() => {
		// check for valid pitch id
		if (isNaN(pitchId) || pitchId <= 0) {
			setLoading(false);
			return;
		}

		const fetchPitch = async () => {
			try {
				const data = await getPitchById(pitchId);
				setPitch(data);
			} catch (err: any) {
				console.error("fetch pitch failed:", err);
				toast.error("failed to load pitch details.");
			} finally {
				setLoading(false);
			}
		};

		fetchPitch();
	}, [pitchId]);

	// render loader while checking auth, profile, or pitch data
	if (loading) return <LoaderComponent />;

	// display error if pitch is null after loading
	if (!pitch) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
				<p className="text-red-500 text-lg font-semibold mb-4">pitch not found.</p>
				<button
					className="btn btn-outline btn-md px-6"
					onClick={() => router.back()}
				>
					go back
				</button>
			</div>
		);
	}

	// handles investment submission logic
	const handleSubmit = async () => {
		// validation checks
		if (!amount || amount <= 0) {
			toast.error("enter a valid investment amount.");
			return;
		}

		// balance check
		if (!userProfile?.dashboard_balance || amount > userProfile.dashboard_balance) {
			toast.error("insufficient balance to make this investment.");
			return;
		}

		setIsSubmitting(true);
		try {
			// post investment data to api
			await axios.post("/investment", {
				pitch_id: pitch.id,
				amount,
			});
			toast.success("investment successful!");
			// redirect to pitch detail page
			router.push(`/pitches/${pitch.id}`);
		} catch (err: any) {
			console.error(err);
			// handle specific api errors (e.g., 402 for payment/funds)
			if (err.response?.status === 402) {
				toast.error("insufficient funds.");
			} else if (err.response?.data) {
				toast.error(err.response.data);
			} else {
				toast.error("investment failed.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// main component rendering investment form
	return (
		<div className="max-w-4xl mx-auto p-8 space-y-8">
			<div className="space-y-2 text-center">
				<h1 className="text-4xl font-extrabold">{pitch.title}</h1>
				<p className="text-gray-600 text-lg">{pitch.elevator_pitch}</p>
			</div>

			<div className="bg-white rounded-xl p-6 space-y-6 border border-gray-100">
				<h2 className="text-2xl font-semibold text-gray-800">investment tiers</h2>

				{/* display investment tiers */}
				<div className="grid gap-4 md:grid-cols-2">
					{pitch.investment_tiers?.map((tier, index) => {
						// find next tier to define the upper limit of the current tier
						const nextTier = pitch.investment_tiers?.[index + 1];
						// check if the current investment amount falls within this tier's range
						const isAmountInTier =
							amount >= tier.min_amount &&
							(!nextTier || amount < nextTier.min_amount);

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
									min: £{tier.min_amount}
									<br />
									multiplier: {tier.multiplier}x
								</p>
							</div>
						);
					})}
				</div>

				{/* investment amount input */}
				<div className="space-y-2">
					<label className="block font-medium text-gray-700">
						investment amount (£)
					</label>
					<input
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={amount === 0 ? "" : amount}
						// sanitize input to allow only numbers
						onChange={(e) => {
							const val = e.target.value.replace(/[^0-9]/g, "");
							setAmount(val === "" ? 0 : Number(val));
						}}
						className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
						placeholder="enter your investment amount"
					/>
				</div>

				{/* submit button */}
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || amount <= 0}
					className="w-full"
				>
					{isSubmitting ? "processing..." : "invest now"}
				</Button>
			</div>
		</div>
	);
}
