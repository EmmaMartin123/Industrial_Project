// app/business/pitches/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { Plus, Trash } from "lucide-react";
import toast from "react-hot-toast";
import { mockPitches } from "@/lib/mockPitches";
import { Pitch, InvestmentTier } from "@/lib/types/pitch";

export default function EditPitchPage({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const router = useRouter();
	const pitchId = Number(searchParams.id);

	const [pitch, setPitch] = useState<Pitch | null>(null);
	const [tiers, setTiers] = useState<InvestmentTier[]>([]);

	useEffect(() => {
		const foundPitch = mockPitches.find((p) => p.pitch_id === pitchId);
		if (!foundPitch) {
			toast.error("Pitch not found");
			return;
		}
		setPitch(foundPitch);
		setTiers(foundPitch.investment_tiers || []);
	}, [pitchId]);

	if (!pitch) return <div className="p-6">Loading...</div>;

	const handleAddTier = () => {
		setTiers([
			...tiers,
			{
				tier_id: 0,
				pitch_id: pitch.pitch_id,
				name: "",
				min_amount: 0,
				max_amount: 0,
				multiplier: 1,
				created_at: new Date(),
			},
		]);
	};

	const handleRemoveTier = (index: number) => {
		setTiers(tiers.filter((_, i) => i !== index));
	};

	const handleTierChange = (
		index: number,
		field: keyof InvestmentTier,
		value: string | number
	) => {
		const newTiers = [...tiers];
		(newTiers[index] as any)[field] = value;
		setTiers(newTiers);
	};

	const handleSave = () => {
		// Just update the mock pitch
		const updatedPitch = { ...pitch, investment_tiers: tiers };
		const index = mockPitches.findIndex((p) => p.pitch_id === pitch.pitch_id);
		mockPitches[index] = updatedPitch;
		toast.success("Pitch updated in mock data!");
		router.push("/business/manage-pitches");
	};

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">Edit Pitch</h1>

			<div className="space-y-6">
				<div>
					<label className="label">Product Title</label>
					<input
						type="text"
						className="input input-bordered w-full"
						value={pitch.title}
						onChange={(e) => setPitch({ ...pitch, title: e.target.value })}
					/>
				</div>

				<div>
					<label className="label">Elevator Pitch</label>
					<textarea
						className="textarea textarea-bordered w-full"
						value={pitch.elevator_pitch}
						onChange={(e) =>
							setPitch({ ...pitch, elevator_pitch: e.target.value })
						}
					/>
				</div>

				<div>
					<label className="label">Detailed Pitch</label>
					<textarea
						className="textarea textarea-bordered w-full h-32"
						value={pitch.detailed_pitch}
						onChange={(e) =>
							setPitch({ ...pitch, detailed_pitch: e.target.value })
						}
					/>
				</div>

				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<label className="label">Target Investment (£)</label>
						<input
							type="number"
							className="input input-bordered w-full"
							value={pitch.target_amount}
							onChange={(e) =>
								setPitch({ ...pitch, target_amount: Number(e.target.value) })
							}
						/>
					</div>

					<div>
						<label className="label">Profit Share (%)</label>
						<input
							type="number"
							className="input input-bordered w-full"
							value={pitch.profit_share_percent}
							onChange={(e) =>
								setPitch({
									...pitch,
									profit_share_percent: Number(e.target.value),
								})
							}
						/>
					</div>
				</div>

				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Investment Tiers</h2>
					{tiers.map((tier, index) => (
						<div key={index} className="grid md:grid-cols-5 gap-2 items-end">
							<input
								type="text"
								placeholder="Tier Name"
								className="input input-bordered"
								value={tier.name}
								onChange={(e) => handleTierChange(index, "name", e.target.value)}
							/>
							<input
								type="number"
								placeholder="Min £"
								className="input input-bordered"
								value={tier.min_amount}
								onChange={(e) =>
									handleTierChange(index, "min_amount", Number(e.target.value))
								}
							/>
							<input
								type="number"
								placeholder="Max £"
								className="input input-bordered"
								value={tier.max_amount || ""}
								onChange={(e) =>
									handleTierChange(index, "max_amount", Number(e.target.value))
								}
							/>
							<input
								type="number"
								step="0.1"
								placeholder="Multiplier"
								className="input input-bordered"
								value={tier.multiplier}
								onChange={(e) =>
									handleTierChange(index, "multiplier", Number(e.target.value))
								}
							/>
							<button
								type="button"
								className="btn btn-error"
								onClick={() => handleRemoveTier(index)}
							>
								<Trash />
							</button>
						</div>
					))}
					<Button type="button" onClick={handleAddTier}>
						<Plus /> Add Tier
					</Button>
				</div>

				<Button type="button" onClick={handleSave}>
					Save Changes
				</Button>
			</div>
		</div>
	);
}
