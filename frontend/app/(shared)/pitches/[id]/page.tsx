"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import axiosInstance from "@/lib/axios";
import { Pitch, InvestmentTier, PitchMedia } from "@/lib/types/pitch";
import LoaderComponent from "@/components/Loader";
import { getPitch } from "@/lib/api/pitch";

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
					media: (pitchData.media || []) as PitchMedia[],
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
		return <LoaderComponent />;
	}

	if (error || !pitch) {
		return (
			<div className="p-6">
				<h1 className="text-xl font-bold">Error</h1>
				<p>{error || "Pitch data not available."}</p>
				<button
					onClick={() => router.back()}
					className="btn btn-secondary mt-4"
				>
					Go Back
				</button>
			</div>
		);
	}

	return (
		<div style={{ padding: "1rem" }}>
			<h1>{pitch.title}</h1>

			<p><strong>Elevator Pitch:</strong> {pitch.elevator_pitch}</p>
			<p><strong>Details:</strong> {pitch.detailed_pitch}</p>

			{/* Media Display Section */}
			{pitch.media && pitch.media.length > 0 && (
				<div style={{ marginTop: "2rem", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
					<h2>Media 🖼️</h2>
					<div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "1rem" }}>
						{pitch.media
							.sort((a, b) => a.order_in_description - b.order_in_description)
							.map((mediaItem) => {
								const isVideo = mediaItem.media_type.startsWith("video/");
								const isImage = mediaItem.media_type.startsWith("image/");

								// CORRECTED: Use mediaItem.media_id as the unique key
								return (
									<div key={mediaItem.media_id} style={{ maxWidth: isVideo ? "400px" : "200px", border: "1px solid #ccc", padding: "5px" }}>

										{isImage && (
											<img
												src={mediaItem.url}
												alt={`Pitch Media ${mediaItem.order_in_description}`}
												style={{ width: "100%", height: "auto", display: "block" }}
											/>
										)}

										{isVideo && (
											<video controls style={{ width: "100%", height: "auto", display: "block" }}>
												<source src={mediaItem.url} type={mediaItem.media_type} />
												Your browser does not support the video tag.
											</video>
										)}

										{!isImage && !isVideo && (
											<p>Unsupported Media Type: {mediaItem.media_type}</p>
										)}

									</div>
								);
							})}
					</div>
				</div>
			)}

			<hr style={{ margin: "2rem 0" }} />

			<p><strong>Target:</strong> ${pitch.target_amount}</p>
			<p><strong>Raised:</strong> ${pitch.raised_amount}</p>
			<p><strong>Profit Share:</strong> {pitch.profit_share_percent}%</p>
			<p><strong>Status:</strong> {pitch.status}</p>
			<p>
				<strong>Investment Start Date:</strong>{" "}
				{pitch.investment_start_date.toLocaleDateString()}
				<br />
				<strong>Investment End Date:</strong>{" "}
				{pitch.investment_end_date.toLocaleDateString()}
			</p>

			{/* Investment Tiers Section */}
			{pitch.investment_tiers && pitch.investment_tiers.length > 0 && (
				// CORRECTED: Added key={index} to the wrapping div for the entire tiers block
				// Although this is a single element wrapped in conditional logic, it's good practice 
				// if this block was part of a larger list render. Since it's not, we only need keys
				// on the children being mapped.
				<div style={{ marginTop: "1rem" }}>
					<h2><strong>Investment Tiers</strong></h2>
					<br />
					<ul>
						{pitch.investment_tiers.map((tier) => (
							// CORRECTED: Use tier.tier_id as the unique key for the <li>
							<li key={tier.tier_id}>
								Name: {tier.name},
								Max amount: ${tier.max_amount}, Min amount: ${tier.min_amount},
								Multiplier: {tier.multiplier}%
								<br />
								<br />
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
