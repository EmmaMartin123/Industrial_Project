"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, Eye, DollarSign, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getAllPitches } from "@/lib/api/pitch";
import { Pitch } from "@/lib/types/pitch";
import * as Button from "@/components/Button";
import LoaderComponent from "@/components/Loader";

export default function ManagePitchesPage() {
	const router = useRouter();

	const [userId, setUserId] = useState<string | null>(null);
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const getSession = async () => {
			setLoading(true);
			try {
				const { data: { session }, error } = await supabase.auth.getSession();

				if (error) {
					throw error;
				}

				setUserId(session?.user?.id || null);
			} catch (e) {
				console.error("Supabase Auth Error:", e);
				setUserId(null);
				setError("Authentication failed. Please log in.");
			}
		};

		getSession();

	}, []);

	useEffect(() => {
		if (userId === undefined) return;

		if (!userId) {
			setError("Authentication required to view pitches.");
			setLoading(false);
			return;
		}

		const fetchUserPitches = async () => {
			try {
				setLoading(true);
				setError(null);

				const fetchedData = await getAllPitches(userId);

				const safePitches: Pitch[] = Array.isArray(fetchedData) ? fetchedData : [];

				setPitches(safePitches);
			} catch (err: any) {
				console.error("Failed to fetch user pitches:", err);
				toast.error("Failed to load your pitches.");
				setError("Could not load pitches due to a server error.");

				setPitches([]);
			} finally {
				setLoading(false);
			}
		};

		fetchUserPitches();

	}, [userId]);

	if (loading) {
		return <LoaderComponent />;
	}

	if (error) {
		return (
			<div className="min-h-screen bg-base-100 p-6">
				<h1 className="text-3xl font-bold mb-6 text-error">Error</h1>
				<p>{error}</p>
				<button
					className={`${Button.buttonClassName} mt-4`}
					onClick={() => window.location.reload()}
				>
					Try Again
				</button>
			</div>
		);
	}

	if (pitches.length === 0) {
		return (
			<div className="min-h-screen bg-base-100 p-6">
				<h1 className="text-3xl font-bold mb-6">Manage Pitches</h1>
				<div className="">
					<p>You currently have no pitches.</p>
					<button className={Button.buttonClassName + " mt-4"} onClick={() => router.push("/business/pitches/new")}>
						<Plus size={16} /> Create New Pitch
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">Manage Pitches</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{pitches.map((pitch) => (
					<div key={pitch.pitch_id} className="card shadow-lg bg-base-100 p-6 flex flex-col justify-between">
						<div>
							<h2 className="text-xl font-semibold mb-2">{pitch.title}</h2>
							<p className="opacity-70 mb-1">Status: **{pitch.status}**</p>
							<p className="opacity-70 mb-1">
								Raised: **£{pitch.raised_amount}** / £{pitch.target_amount}
							</p>
							<p className="opacity-70">Profit Share: {pitch.profit_share_percent}%</p>
						</div>
						<div className="mt-4 flex flex-wrap gap-2">
							<button
								className={`${Button.buttonOutlineClassName}`}
								onClick={() => {
									const pitchToEdit = pitches.find((p) => p.pitch_id === pitch.pitch_id);
									if (pitchToEdit?.status === "Funded") {
										toast.error("Cannot edit a funded pitch");
										return;
									}
									router.push(`/business/manage-pitches/${pitch.pitch_id}/edit`);
								}}
								disabled={pitch.status === "Funded"}
							>
								<Pencil size={16} /> Edit
							</button>
							<button
								className={`${Button.buttonOutlineClassName}`}
								onClick={() => router.push(`/pitches/${pitch.pitch_id}`)}
							>
								<Eye size={16} /> View
							</button>
							{pitch.status === "Funded" && (
								<button
									className="flex items-center gap-1 btn-outline btn-sm"
									onClick={() => router.push(`/business/profit-distribution?pitchId=${pitch.pitch_id}`)}
								>
									<DollarSign size={16} /> Distribute Profit
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
