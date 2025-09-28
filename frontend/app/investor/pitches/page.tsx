"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";

type Pitch = {
	pitch_id: number;
	title: string;
	elevator_pitch: string;
	detailed_pitch: string;
	target_amount: number;
	profit_share_percent: number;
};

export default function PitchesPage() {
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);

	const { authUser } = useAuthStore();

	useEffect(() => {
		const fetchPitches = async () => {
			if (!authUser) {
				toast.error("You must be logged in to view pitches");
				setLoading(false);
				return;
			}

			try {
				// get the JWT token
				const token = (await supabase.auth.getSession()).data.session?.access_token;
				if (!token) {
					toast.error("Not authenticated");
					return;
				}

				const res = await axiosInstance.get("pitch", {
					headers: { Authorization: `Bearer ${token}` },
				});

				setPitches(res.data);
			} catch (err: any) {
				console.error("Error fetching pitches:", err);
				toast.error("Failed to fetch pitches");
			} finally {
				setLoading(false);
			}
		};

		fetchPitches();
	}, [authUser]);

	if (loading) return <div className="p-6">Loading pitches...</div>;

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Available Pitches</h1>
			<ul className="space-y-2">
				{pitches.map((pitch) => (
					<li
						key={pitch.pitch_id}
						className="p-4 rounded-md bg-base-200 shadow-sm hover:bg-base-300 transition"
					>
						<h2 className="font-semibold">{pitch.title}</h2>
						<p className="text-sm opacity-80">{pitch.elevator_pitch}</p>
						<p className="mt-1 text-sm">
							Target: £{pitch.target_amount.toLocaleString()} | Profit Share: {pitch.profit_share_percent}%
						</p>
					</li>
				))}
			</ul>
		</div>
	);
}
