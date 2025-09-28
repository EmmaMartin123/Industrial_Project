"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash } from "lucide-react";

import Button from "@/components/Button";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/lib/store/authStore";
import { InvestmentTier } from "@/lib/types/pitch";
import { supabase } from "@/lib/supabaseClient";

export default function NewPitchPage() {
	const { authUser } = useAuthStore();

	const [title, setTitle] = useState("");
	const [elevator, setElevator] = useState("");
	const [description, setDescription] = useState("");
	const [targetAmount, setTargetAmount] = useState<number | "">("");
	const [profitShare, setProfitShare] = useState<number | "">("");
	const [endDate, setEndDate] = useState("");
	const [tiers, setTiers] = useState<Partial<InvestmentTier>[]>([
		{ name: "", min_amount: 0, multiplier: 1 },
	]);
	const [loading, setLoading] = useState(false);

	// Tier handlers
	const handleAddTier = () => setTiers([...tiers, { name: "", min_amount: 0, multiplier: 1 }]);
	const handleRemoveTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));
	const handleTierChange = (index: number, field: keyof Partial<InvestmentTier>, value: string | number) => {
		const newTiers = [...tiers];
		newTiers[index][field] = value as any;
		setTiers(newTiers);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!authUser) return toast.error("You must be logged in to submit a pitch");
		if (!endDate) return toast.error("Investment end date is required");

		setLoading(true);
		try {
			// get the JWT token
			const token = (await supabase.auth.getSession()).data.session?.access_token;
			if (!token) {
				toast.error("Not authenticated");
				return;
			}

			const payload = {
				title,
				elevator_pitch: elevator,
				detailed_pitch: description,
				target_amount: Number(targetAmount),
				investment_start_date: new Date().toISOString(),
				investment_end_date: new Date(endDate).toISOString(),
				profit_share_percent: Number(profitShare),
				investment_tiers: tiers.map((t) => ({
					name: t.name!,
					min_amount: Number(t.min_amount),
					multiplier: Number(t.multiplier),
				})),
			};

			await axiosInstance.post("/pitch", payload, {
				headers: { Authorization: `Bearer ${token}` },
			});

			toast.success("Pitch submitted successfully!");
			// Reset form
			setTitle("");
			setElevator("");
			setDescription("");
			setTargetAmount("");
			setProfitShare("");
			setEndDate("");
			setTiers([{ name: "", min_amount: 0, multiplier: 1 }]);
		} catch (err: any) {
			console.error(err);
			toast.error(err.response?.data || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">Create New Pitch</h1>
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Title */}
				<div>
					<label className="label">Product Title</label>
					<input
						type="text"
						className="input input-bordered w-full"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
					/>
				</div>

				{/* Elevator Pitch */}
				<div>
					<label className="label">Elevator Pitch</label>
					<textarea
						className="textarea textarea-bordered w-full"
						value={elevator}
						onChange={(e) => setElevator(e.target.value)}
						required
					/>
				</div>

				{/* Detailed Pitch */}
				<div>
					<label className="label">Detailed Pitch</label>
					<textarea
						className="textarea textarea-bordered w-full h-32"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						required
					/>
				</div>

				{/* Target & Profit Share */}
				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<label className="label">Target Investment (£)</label>
						<input
							type="number"
							className="input input-bordered w-full"
							value={targetAmount}
							onChange={(e) => setTargetAmount(Number(e.target.value))}
							required
							min={0}
						/>
					</div>
					<div>
						<label className="label">Investor Profit Share (%)</label>
						<input
							type="number"
							className="input input-bordered w-full"
							value={profitShare}
							onChange={(e) => setProfitShare(Number(e.target.value))}
							required
							min={0}
							max={100}
						/>
					</div>
				</div>

				{/* Investment End Date */}
				<div>
					<label className="label">Investment End Date</label>
					<input
						type="date"
						className="input input-bordered w-full"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
						required
					/>
				</div>

				{/* Investment Tiers */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Investment Tiers</h2>
					{tiers.map((tier, index) => (
						<div key={index} className="grid md:grid-cols-4 gap-2 items-end">
							<input
								type="text"
								placeholder="Tier Name"
								className="input input-bordered"
								value={tier.name || ""}
								onChange={(e) => handleTierChange(index, "name", e.target.value)}
								required
							/>
							<input
								type="number"
								placeholder="Min £"
								className="input input-bordered"
								value={tier.min_amount || ""}
								onChange={(e) => handleTierChange(index, "min_amount", Number(e.target.value))}
								required
								min={0}
							/>
							<input
								type="number"
								step="0.1"
								placeholder="Multiplier"
								className="input input-bordered"
								value={tier.multiplier || 1}
								onChange={(e) => handleTierChange(index, "multiplier", Number(e.target.value))}
								required
								min={0}
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

					<Button type="button" onClick={handleAddTier} className="mt-2">
						<Plus /> Add Tier
					</Button>
				</div>

				{/* Submit */}
				<Button type="submit" className="mt-4" disabled={loading}>
					{loading ? "Submitting..." : "Submit Pitch"}
				</Button>
			</form>
		</div>
	);
}
