"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import axiosInstance from "@/lib/axios";
import { Pitch, InvestmentTier } from "@/lib/types/pitch";

interface ViewPitchPageProps {
	params: Promise<{ id: string }>;
}

export default function ViewPitchPage({ params }: ViewPitchPageProps) {
	const router = useRouter();

	const resolved_params = use(params);

	const pitchId = Number(resolved_params.id);

	const [pitch, setPitch] = useState<Pitch | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isNaN(pitchId) || pitchId <= 0) {
			setError("Invalid Pitch ID format in URL.");
			setLoading(false);
			return;
		}

		const fetchPitch = async () => {
			try {
				const res = await axiosInstance.get(`/pitch?id=${pitchId}`);
				const pitchData = Array.isArray(res.data) ? res.data[0] : res.data;

				if (!pitchData) {
					setError("Pitch not found.");
					return;
				}

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

	if (loading) {
		return <div>Loading pitch...</div>;
	}

	if (error || !pitch) {
		return (
			<div>
				<h1>Error</h1>
				<p>{error || "Pitch data not available."}</p>
				<button onClick={() => router.back()}>Go Back</button>
			</div>
		);
	}

	return (
		<div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
			<button onClick={() => router.back()}>Back to Pitches</button>
			<hr />

			<h1>{pitch.title}</h1>
			<p>"{pitch.elevator_pitch}"</p>

			<h2>Detailed Pitch:</h2>
			<p>{pitch.detailed_pitch}</p>

			<h2>Key Metrics:</h2>
			<ul>
				<li>Status: {pitch.status}</li>
				<li>Profit Share: {pitch.profit_share_percent}%</li>
				<li>Target Investment: £{pitch.target_amount.toLocaleString()}</li>
				<li>Raised Amount: £{pitch.raised_amount.toLocaleString()}</li>
				<li>Investment Start: {pitch.investment_start_date.toLocaleDateString()}</li>
				<li>Investment End: {pitch.investment_end_date.toLocaleDateString()}</li>
			</ul>

			{pitch.investment_tiers && pitch.investment_tiers.length > 0 && (
				<>
					<h2>Investment Tiers:</h2>
					{pitch.investment_tiers.map((tier: InvestmentTier) => (
						<div key={tier.tier_id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
							<h3>Tier Name: {tier.name}</h3>
							<p>Min Investment: £{tier.min_amount.toLocaleString()}</p>
							{tier.max_amount && (
								<p>Max Investment: £{tier.max_amount.toLocaleString()}</p>
							)}
							<p>Multiplier: {tier.multiplier}x</p>
						</div>
					))}
				</>
			)}

			<hr />
			<button onClick={() => {/* handle investment */ }}>Invest Now</button>
		</div>
	);
}
