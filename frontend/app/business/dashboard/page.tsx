"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Users, Coins, PlusCircle } from "lucide-react";
import * as Button from "@/components/Button";

export default function BusinessDashboard() {
	const router = useRouter();

	// Mocked dashboard data
	const [dashboardData, setDashboardData] = useState({
		totalPitches: 3,
		totalRaised: 12500,
		pendingProfits: 2,
		latestPitches: [
			{ id: 1, title: "EcoBottle", status: "Active" },
			{ id: 2, title: "Smart Wallet", status: "Funded" },
			{ id: 3, title: "AI Tutor", status: "Draft" },
		],
	});

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-4xl font-bold mb-6">Business Dashboard</h1>

			{/* Quick action buttons */}
			<div className="flex flex-wrap gap-4 mb-10">
				<button
					className={`${Button.buttonClassName}`}
					onClick={() => router.push("/business/pitches/new")}
				>
					<PlusCircle /> New Pitch
				</button>
				<button
					className={`${Button.buttonOutlineClassName}`}
					onClick={() => router.push("/business/pitches/manage")}
				>
					<Users /> Manage Pitches
				</button>
				<button
					className={`${Button.buttonOutlineClassName}`}
					onClick={() => router.push("/business/profit-distribution")}
				>
					<Coins /> Profit Distribution
				</button>
			</div>

			{/* Dashboard stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
				<div className="card p-6 shadow-lg bg-base-100 flex flex-col items-center">
					<Users className="w-10 h-10 text-primary mb-2" />
					<h2 className="text-2xl font-semibold">{dashboardData.totalPitches}</h2>
					<p className="opacity-70">Total Pitches</p>
				</div>
				<div className="card p-6 shadow-lg bg-base-100 flex flex-col items-center">
					<Coins className="w-10 h-10 text-primary mb-2" />
					<h2 className="text-2xl font-semibold">£{dashboardData.totalRaised}</h2>
					<p className="opacity-70">Total Raised</p>
				</div>
				<div className="card p-6 shadow-lg bg-base-100 flex flex-col items-center">
					<PieChart className="w-10 h-10 text-primary mb-2" />
					<h2 className="text-2xl font-semibold">{dashboardData.pendingProfits}</h2>
					<p className="opacity-70">Pending Profit Distributions</p>
				</div>
			</div>

			{/* Recent pitches */}
			<div className="card p-6 shadow-lg bg-base-100">
				<h2 className="text-xl font-bold mb-4">Latest Pitches</h2>
				<ul className="divide-y divide-base-200">
					{dashboardData.latestPitches.map((pitch) => (
						<li key={pitch.id} className="py-3 flex justify-between">
							<span>{pitch.title}</span>
							<span className="opacity-70">{pitch.status}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
