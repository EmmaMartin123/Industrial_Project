"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import toast from "react-hot-toast";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { mockPitches } from "@/lib/mockPitches"; // Replace with backend fetch later

import { useAuthStore } from "@/lib/store/authStore";

export default function BusinessPitchesPage() {
	const router = useRouter();
	const [pitches, setPitches] = useState(mockPitches);
	const [loading, setLoading] = useState(true);

	const { authUser, checkAuth } = useAuthStore();

	// check if user is already logged in and redirect if not
	useEffect(() => {
		checkAuth().then(() => {
			if (!authUser) {
				router.push("/login");
			}
		});
	}, [authUser, checkAuth, router]);

	useEffect(() => {
		// TODO: Replace with actual fetch from backend
		setTimeout(() => setLoading(false), 500);
	}, []);

	const handleView = (pitchId: number) => {
		router.push(`/view-pitch?id=${pitchId}`);
	};

	if (loading) return <div className="p-6">Loading pitches...</div>;

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">All Pitches</h1>

			{pitches.length === 0 ? (
				<p>No pitches available.</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{pitches.map((pitch) => (
						<div
							key={pitch.pitch_id}
							className="card bg-base-100 shadow-lg p-6 flex flex-col justify-between"
						>
							<div>
								<h2 className="text-xl font-semibold mb-2">{pitch.title}</h2>
								<p className="opacity-70 mb-1">Status: {pitch.status}</p>
								<p className="opacity-70 mb-1">
									Raised: £{pitch.raised_amount} / £{pitch.target_amount}
								</p>
								<p className="opacity-70">Profit Share: {pitch.profit_share_percent}%</p>
							</div>
							<div className="mt-4 flex justify-end">
								<Button
									className="flex items-center gap-1 btn-outline btn-sm"
									onClick={() => handleView(pitch.pitch_id)}
								>
									<Eye /> View
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

