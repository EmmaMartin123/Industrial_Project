"use client";

import { PlusCircle, BarChart3, Coins, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import Button from "@/components/Button";

export default function BusinessDashboard() {
	const router = useRouter();

	const pitches = [
		{
			id: 1,
			title: "pitch 1",
			target: 20000,
			raised: 12500,
			investors: 48,
			status: "Active",
		},
		{
			id: 2,
			title: "ptch 2",
			target: 15000,
			raised: 15000,
			investors: 60,
			status: "Funded",
		},
		{
			id: 3,
			title: "pitch 3",
			target: 30000,
			raised: 8000,
			investors: 20,
			status: "Draft",
		},
	];

	return (
		<div className="min-h-screen bg-base-100 p-8">
			{/* Header */}
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold">Business Dashboard</h1>
					<p className="text-base-content/60">
						Manage your pitches, track funding, and distribute profits.
					</p>
				</div>
				<Button
					onClick={() => router.push("/business/pitches/new")}
					className=""
				>
					<PlusCircle className="w-5 h-5" />
					New Pitch
				</Button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
				<div className="card bg-base-200 shadow-md p-6 flex items-center gap-4">
					<BarChart3 className="w-8 h-8 text-primary" />
					<div>
						<p className="text-sm text-base-content/60">Active Pitches</p>
						<h3 className="text-xl font-bold text-center mt-4">2</h3>
					</div>
				</div>
				<div className="card bg-base-200 shadow-md p-6 flex items-center gap-4">
					<Coins className="w-8 h-8 text-secondary" />
					<div>
						<p className="text-sm text-base-content/60">Total Raised</p>
						<h3 className="text-xl font-bold text-center mt-4">£27,500</h3>
					</div>
				</div>
				<div className="card bg-base-200 shadow-md p-6 flex items-center gap-4">
					<Users className="w-8 h-8 text-accent" />
					<div>
						<p className="text-sm text-base-content/60">Total Investors</p>
						<h3 className="text-xl font-bold text-center mt-4">128</h3>
					</div>
				</div>
			</div>

			{/* Pitch List */}
			<h2 className="text-2xl font-semibold mb-4">Your Pitches</h2>
			<div className="overflow-x-auto">
				<table className="table w-full">
					<thead>
						<tr>
							<th>Title</th>
							<th>Funding</th>
							<th>Investors</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{pitches.map((pitch) => (
							<tr key={pitch.id}>
								<td className="font-medium">{pitch.title}</td>
								<td>
									£{pitch.raised.toLocaleString()} / £
									{pitch.target.toLocaleString()}
								</td>
								<td>{pitch.investors}</td>
								<td>
									<span
										className={`badge ${pitch.status === "Funded"
												? "badge-success"
												: pitch.status === "Active"
													? "badge-primary"
													: "badge-ghost"
											}`}
									>
										{pitch.status}
									</span>
								</td>
								<td className="space-x-2">
									<button
										onClick={() =>
											router.push(`/(business)/pitches/${pitch.id}`)
										}
										className="btn btn-sm btn-outline"
									>
										View
									</button>
									{pitch.status === "Active" && (
										<button
											onClick={() =>
												router.push(`/(business)/pitches/${pitch.id}/profit`)
											}
											className="btn btn-sm btn-secondary"
										>
											Distribute Profit
										</button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
