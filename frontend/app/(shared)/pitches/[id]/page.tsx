"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { getPitch } from "@/lib/api/pitch";
import { Pitch, InvestmentTier, PitchMedia } from "@/lib/types/pitch";

import LoaderComponent from "@/components/Loader";

// ✅ Import carousel components from shadcn/ui
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";

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
				const pitchData = await getPitch(pitchId);

				const finalPitchData = Array.isArray(pitchData)
					? pitchData[0]
					: pitchData;

				if (!finalPitchData) {
					setError("Pitch not found.");
					return;
				}

				const mappedPitch: Pitch = {
					pitch_id: finalPitchData.id || finalPitchData.pitch_id,
					title: finalPitchData.title,
					elevator_pitch: finalPitchData.elevator_pitch,
					detailed_pitch: finalPitchData.detailed_pitch,
					target_amount: finalPitchData.target_amount,
					raised_amount: finalPitchData.raised_amount ?? 0,
					profit_share_percent: finalPitchData.profit_share_percent,
					status: "ddd",
					investment_start_date: new Date(finalPitchData.investment_start_date),
					investment_end_date: new Date(finalPitchData.investment_end_date),
					created_at: new Date(finalPitchData.created_at ?? Date.now()),
					updated_at: new Date(finalPitchData.updated_at ?? Date.now()),
					investment_tiers: (finalPitchData.investment_tiers ||
						[]) as InvestmentTier[],
					media: (finalPitchData.media || []) as PitchMedia[],
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

			<p>
				<strong>Elevator Pitch:</strong> {pitch.elevator_pitch}
			</p>
			<p>
				<strong>Details:</strong> {pitch.detailed_pitch}
			</p>

			{pitch.media && pitch.media.length > 0 && (
				<div className="mt-8 border-t pt-6">
					<h2 className="text-lg font-semibold mb-4">Media 🖼️</h2>

					<Carousel className="w-full max-w-2xl mx-auto">
						<CarouselContent>
							{pitch.media
								.sort((a, b) => a.order_in_description - b.order_in_description)
								.map((mediaItem) => (
									<CarouselItem key={mediaItem.media_id}>
										<div className="flex items-center justify-center">
											<div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-md">
												{mediaItem.media_type.startsWith("image/") && (
													<img
														src={mediaItem.url}
														alt={`Pitch Media ${mediaItem.order_in_description}`}
														className="w-full h-full object-cover"
													/>
												)}

												{mediaItem.media_type.startsWith("video/") && (
													<video
														controls
														className="w-full h-full object-cover"
													>
														<source src={mediaItem.url} type={mediaItem.media_type} />
														Your browser does not support the video tag.
													</video>
												)}
											</div>
										</div>
									</CarouselItem>
								))}
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
				</div>
			)}

			<hr style={{ margin: "2rem 0" }} />

			<p>
				<strong>Target:</strong> ${pitch.target_amount}
			</p>
			<p>
				<strong>Raised:</strong> ${pitch.raised_amount}
			</p>
			<p>
				<strong>Profit Share:</strong> {pitch.profit_share_percent}%
			</p>
			<p>
				<strong>Status:</strong> {pitch.status}
			</p>
			<p>
				<strong>Investment Start Date:</strong>{" "}
				{pitch.investment_start_date.toLocaleDateString()}
				<br />
				<strong>Investment End Date:</strong>{" "}
				{pitch.investment_end_date.toLocaleDateString()}
			</p>

			{pitch.investment_tiers && pitch.investment_tiers.length > 0 && (
				<div className="mt-4">
					<h2 className="font-bold text-lg">Investment Tiers</h2>
					<ul className="list-disc ml-6 mt-2">
						{pitch.investment_tiers.map((tier) => (
							<li key={tier.tier_id} className="mb-2">
								<span className="font-semibold">{tier.name}</span> — Min: $
								{tier.min_amount}, Max: ${tier.max_amount}, Multiplier:{" "}
								{tier.multiplier}%
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
