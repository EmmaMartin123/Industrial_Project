"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/authStore";
import { mockInvestments } from "@/lib/mockInvestments";
import * as Button from "@/components/Button";

export default function PortfolioPage() {
	const router = useRouter();
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	const [investments, setInvestments] = useState<typeof mockInvestments>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!isCheckingAuth && !authUser) {
			router.push("/login");
		}
	}, [isCheckingAuth, authUser, router]);

	useEffect(() => {
		// Simulate fetching data
		setTimeout(() => {
			setInvestments(mockInvestments);
			setLoading(false);
		}, 500);
	}, []);

	if (isCheckingAuth || !authUser || loading) return <div className="p-6">Loading portfolio...</div>;

	if (investments.length === 0)
		return <div className="p-6">You have not invested in any pitches yet.</div>;

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">My Portfolio</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{investments.map((inv) => (
					<div key={inv.investment_id} className="card shadow-lg bg-base-100 p-6 flex flex-col justify-between">
						<div>
							<h2 className="text-xl font-semibold mb-2">Pitch title</h2>
							<p className="opacity-70 mb-1">Invested: £{inv.amount}</p>
							<p className="opacity-70 mb-1">
								Date: {inv.created_at.toLocaleDateString()}
							</p>
							<p className="opacity-70">
								Status: {inv.refunded ? "Refunded" : "Active"}
							</p>
						</div>
						<div className="mt-4 flex justify-end">
							<button
								className={`${Button.buttonOutlineClassName}`}
								onClick={() => router.push(`/view-pitch?id=${inv.pitch_id}`)}
							>
								View Pitch
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

