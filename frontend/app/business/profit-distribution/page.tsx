"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { mockPitches } from "@/lib/mockPitches";
import * as Button from "@/components/Button";
import { useAuthStore } from "@/lib/store/authStore";
import { useProtect } from "@/lib/auth/auth";

export default function ProfitDistributionPage({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const { userProfile, isLoading } = useProtect();

	const router = useRouter();
	const pitchIdParam = searchParams.pitchId;
	const pitchId = pitchIdParam ? Number(pitchIdParam) : null;

	const pitch = mockPitches.find((p) => p.id === pitchId);

	const [profitAmount, setProfitAmount] = useState<number | "">("");
	const [distributing, setDistributing] = useState(false);

	if (!pitch) {
		return (
			<div className="min-h-screen bg-base-100 p-6">
				<h1 className="text-2xl font-bold">Pitch not found</h1>
				<button 
					className={`${Button.buttonOutlineClassName}`}
					onClick={() => router.back()}
				>
					Go Back
				</button>
			</div>
		);
	}

	const handleDistribute = () => {
		if (!profitAmount || profitAmount <= 0) {
			toast.error("Enter a valid profit amount");
			return;
		}

		setDistributing(true);

		// Mock profit distribution
		setTimeout(() => {
			const distributableProfit =
				(profitAmount * pitch.profit_share_percent) / 100;
			toast.success(
				`£${distributableProfit.toLocaleString()} distributed to investors of "${pitch.title}"`
			);
			setDistributing(false);
			setProfitAmount("");
		}, 1000);
	};

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">Profit Distribution</h1>

			<div className="card p-6 bg-base-100 shadow-lg mb-6">
				<h2 className="text-xl font-semibold mb-2">{pitch.title}</h2>
				<p className="opacity-70 mb-1">Status: {pitch.status}</p>
				<p className="opacity-70 mb-1">
					Raised: £{pitch.raised_amount} / £{pitch.target_amount}
				</p>
				<p className="opacity-70 mb-1">
					Profit Share: {pitch.profit_share_percent}%
				</p>
			</div>

			<div className="card p-6 bg-base-100 shadow-lg">
				<label className="label">
					<span className="label-text">Declare Profit Amount (£)</span>
				</label>
				<input
					type="number"
					min={0}
					value={profitAmount}
					onChange={(e) => setProfitAmount(Number(e.target.value))}
					className="input input-bordered w-full mb-4"
				/>
				<button onClick={handleDistribute} disabled={distributing}
					className={`${Button.buttonClassName}`}
				>
					{distributing ? "Distributing..." : "Distribute Profit"}
				</button>
			</div>
		</div>
	);
}
