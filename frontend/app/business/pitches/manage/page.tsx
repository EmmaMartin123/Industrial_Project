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
				if (error) throw error;
				setUserId(session?.user?.id || null);
			} catch (e) {
				console.error("Supabase Auth Error:", e);
				setUserId(null);
				setError("Authentication failed. Please log in.");
			} finally {
				setLoading(false);
			}
		};
		getSession();
	}, []);

	useEffect(() => {
		if (!userId) return;

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

	if (loading) return <LoaderComponent />;

	if (error) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
				<h1 className="text-3xl font-bold text-red-600 mb-2">Error</h1>
				<p className="text-gray-600 dark:text-gray-400">{error}</p>
				<button className={`${Button.buttonClassName} mt-6`} onClick={() => window.location.reload()}>
					Try Again
				</button>
			</div>
		);
	}

	if (pitches.length === 0) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-6">
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Manage Pitches</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-6">You currently have no pitches created yet.</p>
				<button
					className={`${Button.buttonClassName} flex items-center gap-2`}
					onClick={() => router.push("/business/pitches/new")}
				>
					<Plus size={18} /> Create New Pitch
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">Manage Pitches</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							View, edit, and manage your active investment pitches.
						</p>
					</div>
					<button
						className={`${Button.buttonClassName} mt-6 md:mt-0 flex items-center gap-2`}
						onClick={() => router.push("/business/pitches/new")}
					>
						<Plus size={18} /> New Pitch
					</button>
				</div>

				{/* Pitch Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{pitches.map((pitch) => (
						<div
							key={pitch.pitch_id}
							className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
						>
							<div>
								<h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition">
									{pitch.title}
								</h2>
								<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
									<span className="font-medium text-gray-800 dark:text-gray-200">Status:</span>{" "}
									<span
										className={`${pitch.status === "Funded"
												? "text-green-600 dark:text-green-400"
												: pitch.status === "Draft"
													? "text-gray-500"
													: "text-yellow-600 dark:text-yellow-400"
											}`}
									>
										{pitch.status}
									</span>
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
									<span className="font-medium text-gray-800 dark:text-gray-200">Raised:</span> £
									{pitch.raised_amount} / £{pitch.target_amount}
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									<span className="font-medium text-gray-800 dark:text-gray-200">Profit Share:</span>{" "}
									{pitch.profit_share_percent}%
								</p>
							</div>

							{/* Actions */}
							<div className="mt-6 flex flex-wrap gap-2">
								<button
									className={`${Button.buttonOutlineClassName}`}
									onClick={() => {
										if (pitch.status === "Funded") {
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
										className={`${Button.buttonOutlineClassName}`}
										onClick={() =>
											router.push(`/business/profit-distribution?pitchId=${pitch.pitch_id}`)
										}
									>
										<DollarSign size={16} /> Distribute
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
