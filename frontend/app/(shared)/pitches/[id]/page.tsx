"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getPitch } from "@/lib/api/pitch";
import { Pitch, InvestmentTier, PitchMedia } from "@/lib/types/pitch";
import LoaderComponent from "@/components/Loader";
import * as Button from "@/components/Button";
// Import the required Icon from lucide-react
import { Info } from "lucide-react";

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";

import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card"

import { Progress } from "@/components/ui/progress";
import { toast } from "sonner"

const calculateDaysRemaining = (endDate: Date): number | null => {
	const today = new Date();
	// set both to start of day for accurate calculation
	today.setHours(0, 0, 0, 0);
	endDate.setHours(0, 0, 0, 0);

	const diffTime = endDate.getTime() - today.getTime();
	if (diffTime <= 0) return 0;

	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
};

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
					id: finalPitchData.id || finalPitchData.pitch_id,
					title: finalPitchData.title,
					elevator_pitch: finalPitchData.elevator_pitch,
					detailed_pitch: finalPitchData.detailed_pitch,
					target_amount: finalPitchData.target_amount,
					raised_amount: finalPitchData.raised_amount ?? 0,
					profit_share_percent: finalPitchData.profit_share_percent,
					status: "Active",
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

	if (loading) return <LoaderComponent />;

	if (error || !pitch) {
		return (
			<div className="p-6 text-center">
				<h1 className="text-xl font-bold mb-2">Error</h1>
				<p className="text-muted-foreground">{error || "Pitch data not available."}</p>
				<button
					onClick={() => router.back()}
					className="btn btn-secondary mt-4"
				>
					Go Back
				</button>
			</div>
		);
	}

	const progress =
		(pitch.raised_amount / pitch.target_amount) * 100 > 100
			? 100
			: (pitch.raised_amount / pitch.target_amount) * 100;

	const handleInvest = () => {
		router.push(`/pitches/${pitch.id}/invest`);
	};

	const DateDisplay = () => {
		const startDate = pitch.investment_start_date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
		const endDate = pitch.investment_end_date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
		const daysRemaining = calculateDaysRemaining(pitch.investment_end_date);

		const isInvestmentOpen = daysRemaining !== null && daysRemaining > 0;
		const daysText = isInvestmentOpen
			? <span className="text-lg font-bold text-blue-600">{daysRemaining} days left!</span>
			: <span className="text-lg font-bold text-red-600">Closed</span>;

		return (
			<div className="p-4 border rounded-lg bg-neutral-50 space-y-2">
				<div className="flex justify-between items-center">
					<p className="text-sm font-medium">Investment Window</p>
					{daysText}
				</div>

				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-black">Start:</span> {startDate}
				</p>
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-black">End:</span> {endDate}
				</p>
			</div>
		);
	};

	return (
		<div className="max-w-6xl mx-auto p-8">
			{/* header */}
			<header className="mt-2 mb-8">
				<h1 className="text-4xl font-bold">{pitch.title}</h1>
				<p className="text-lg text-muted-foreground mt-2">
					{pitch.elevator_pitch}
				</p>
			</header>

			{/* main grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* left side: media + description */}
				<div className="lg:col-span-2 space-y-6">
					{/* carousel code */}
					{pitch.media && pitch.media.length > 0 && (
						<div>
							<Carousel className="w-full">
								<CarouselContent>
									{pitch.media
										.sort((a, b) => a.order_in_description - b.order_in_description)
										.map((mediaItem) => (
											<CarouselItem key={mediaItem.media_id}>
												<div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md bg-neutral-100">
													{mediaItem.media_type.startsWith("image/") && (
														<img
															src={mediaItem.url}
															alt={`Pitch Media ${mediaItem.order_in_description}`}
															className="w-full h-full object-cover"
														/>
													)}
													{mediaItem.media_type.startsWith("video/") && (
														<video controls className="w-full h-full object-cover">
															<source src={mediaItem.url} type={mediaItem.media_type} />
															Your browser does not support the video tag.
														</video>
													)}
												</div>
											</CarouselItem>
										))}
								</CarouselContent>

								<CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-outline hover:bg-base-300 rounded-full p-2 shadow-md" />
								<CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-outline hover:bg-base-300 rounded-full p-2 shadow-md" />
							</Carousel>
						</div>
					)}

					{/* details */}
					<section className="space-y-3">
						<h2 className="text-2xl font-semibold">About this Pitch</h2>
						<p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
							{pitch.detailed_pitch}
						</p>
					</section>
				</div>

				{/* right side: funding + stats + tiers */}
				<aside className="space-y-6">
					{/* funding progress */}
					<div className="p-6 border rounded-xl bg-white shadow-sm space-y-4">
						<div className="flex justify-between text-sm">
							<span className="font-medium text-muted-foreground">Raised</span>
							<span className="font-semibold">
								${pitch.raised_amount.toLocaleString()} / $
								{pitch.target_amount.toLocaleString()}
							</span>
						</div>
						<Progress value={progress} className="h-3" />
						<p className="text-xs text-muted-foreground">
							{progress.toFixed(1)}% funded
						</p>
					</div>

					{/* key stats */}
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 border rounded-lg text-center bg-neutral-50">
							<p className="text-xs text-muted-foreground">Profit Share</p>
							<p className="text-lg font-semibold">
								{pitch.profit_share_percent}%
							</p>
						</div>
						<div className="p-4 border rounded-lg text-center bg-neutral-50">
							<p className="text-xs text-muted-foreground">Status</p>
							<p className="text-lg font-semibold text-green-600">
								{pitch.status}
							</p>
						</div>
					</div>

					{/* investment dates */}
					<DateDisplay />

					{/* investment tiers */}
					{pitch.investment_tiers && pitch.investment_tiers.length > 0 && (
						<div className="space-y-3">
							<h2 className="text-lg font-semibold">Investment Tiers</h2>
							<div className="space-y-3">
								{pitch.investment_tiers.map((tier) => (
									<HoverCard key={tier.tier_id} openDelay={200}>
										<HoverCardTrigger asChild>
											<div
												className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition cursor-pointer flex justify-between items-center" // Added flex classes
											>
												<div> {/* New div to wrap tier info */}
													<p className="font-semibold">{tier.name}</p>
													<div className="text-sm text-muted-foreground mt-1">
														<p>Min: £{tier.min_amount}</p>
														<p>Max: £{tier.max_amount}</p>
														<p>Multiplier: {tier.multiplier}x</p>
													</div>
												</div>
												<Info className="w-5 h-5 text-blue-500 flex-shrink-0" /> {/* Added Info icon */}
											</div>
										</HoverCardTrigger>

										<HoverCardContent className="w-80">
											<div className="space-y-2">
												<p className="text-sm font-medium">
													Tier Details: {tier.name}
												</p>
												<p className="text-sm text-muted-foreground">
													This tier is for investments between <strong>£{tier.min_amount}</strong> and <strong>£{tier.max_amount}</strong>.
												</p>
												<p className="text-xs text-muted-foreground">
													You receive a <strong>{tier.multiplier}x</strong> boost on your profit share.
												</p>
											</div>
										</HoverCardContent>
									</HoverCard>
								))}
							</div>
						</div>
					)}

					{/* call to action */}
					<button
						className={Button.buttonClassName + " w-full"}
						onClick={handleInvest}
					>
						Invest Now
					</button>
				</aside>
			</div>
		</div>
	);
}
