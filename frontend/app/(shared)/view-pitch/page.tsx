// app/business/pitches/view/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pitch, InvestmentTier } from "@/lib/types/pitch";
import { mockPitches } from "@/lib/mockPitches";
import * as Button from "@/components/Button";

export default function ViewPitchPage({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const router = useRouter();
	const pitchIdParam = searchParams.id;
	const pitchId = pitchIdParam ? Number(pitchIdParam) : null;

	const [pitch, setPitch] = useState<Pitch | null>(null);

	useEffect(() => {
		if (!pitchId) return;
		const found = mockPitches.find((p) => p.pitch_id === pitchId);
		setPitch(found || null);
	}, [pitchId]);

	if (!pitch) return <div className="p-6">Pitch not found.</div>;

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<button 
				className={`${Button.buttonOutlineClassName}`}
				onClick={() => router.back()}>
				Back
			</button>

			<h1 className="text-3xl font-bold mb-2">{pitch.title}</h1>
			<p className="text-lg mb-4">{pitch.elevator_pitch}</p>
			<p className="mb-4">{pitch.detailed_pitch}</p>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div>
					<p>
						<strong>Status:</strong> {pitch.status}
					</p>
					<p>
						<strong>Target Investment:</strong> £{pitch.target_amount}
					</p>
					<p>
						<strong>Raised:</strong> £{pitch.raised_amount}
					</p>
					<p>
						<strong>Profit Share:</strong> {pitch.profit_share_percent}%
					</p>
				</div>
				<div>
					<p>
						<strong>Investment Start:</strong>{" "}
						{pitch.investment_start_date.toDateString()}
					</p>
					<p>
						<strong>Investment End:</strong>{" "}
						{pitch.investment_end_date.toDateString()}
					</p>
					<p>
						<strong>Created At:</strong> {pitch.created_at.toDateString()}
					</p>
					<p>
						<strong>Updated At:</strong> {pitch.updated_at.toDateString()}
					</p>
				</div>
			</div>

			{pitch.investment_tiers && pitch.investment_tiers.length > 0 && (
				<div className="mb-4">
					<h2 className="text-xl font-semibold mb-2">Investment Tiers</h2>
					<ul className="space-y-2">
						{pitch.investment_tiers.map((tier: InvestmentTier) => (
							<li
								key={tier.tier_id}
								className="p-3 border rounded-md bg-base-200"
							>
								<p>
									<strong>{tier.name}</strong>
								</p>
								<p>
									Min: £{tier.min_amount}{" "}
									{tier.max_amount ? `- £${tier.max_amount}` : ""}
								</p>
								<p>Multiplier: {tier.multiplier}</p>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
