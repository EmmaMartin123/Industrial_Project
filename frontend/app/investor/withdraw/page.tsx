"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/authStore";
import * as Button from "@/components/Button";
import { useProtect } from "@/lib/auth/auth";

export default function WithdrawPage() {
	const { userProfile, isLoading } = useProtect();

	const router = useRouter();

	const [amount, setAmount] = useState("");
	const [loading, setLoading] = useState(false);
	const [balance, setBalance] = useState(10000);

	const handleWithdraw = () => {
		const numAmount = Number(amount);

		if (!numAmount || numAmount <= 0) {
			toast.error("Enter a valid amount");
			return;
		}

		if (numAmount > balance) {
			toast.error("Insufficient balance");
			return;
		}

		setLoading(true);

		// Mock withdraw delay
		setTimeout(() => {
			setBalance((prev) => prev - numAmount);
			toast.success(`Successfully withdrew £${numAmount}`);
			setAmount("");
			setLoading(false);
		}, 1000);
	};

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">Withdraw Funds</h1>
			<p className="mb-4">Your available balance: <strong>£{balance}</strong></p>

			<div className="max-w-md space-y-4">
				<input
					type="number"
					placeholder="Amount to withdraw"
					className="input input-bordered w-full"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
				/>
				<button
					className={`${Button.buttonClassName}`}
					onClick={handleWithdraw} disabled={loading}>
					{loading ? "Processing..." : "Withdraw"}
				</button>
			</div>
		</div>
	);
}


