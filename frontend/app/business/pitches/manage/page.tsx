"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, DollarSign, Plus, PiggyBank } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getAllPitches } from "@/lib/api/pitch";
import { Pitch } from "@/lib/types/pitch";
import { Button } from "@/components/ui/button";
import LoaderComponent from "@/components/Loader";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/store/authStore";
import { useProtect } from "@/lib/auth/auth";

export default function ManagePitchesPage() {
	const { userProfile, isLoading } = useProtect();

	const router = useRouter();

	if (userProfile?.role !== "business") {
		router.push("/investor/dashboard");
	}

	const [userId, setUserId] = useState<string | null>(null);
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// get user session
	useEffect(() => {
		const getSession = async () => {
			setLoading(true);
			try {
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();
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
				setPitches(Array.isArray(fetchedData) ? fetchedData : []);
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
				<Button
					className={`mt-6`}
					onClick={() => window.location.reload()}
				>
					Try Again
				</Button>
			</div>
		);
	}

	if (pitches.length === 0) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-6">
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
					Manage Pitches
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-6">
					You currently have no pitches created yet.
				</p>
				<Button
					className={`flex items-center gap-2`}
					onClick={() => router.push("/business/pitches/new")}
				>
					<Plus size={18} /> Create New Pitch
				</Button>
			</div>
		);
	}

	const handleEdit = (e: React.MouseEvent, pitchId: number, status: string) => {
		e.stopPropagation();
		if (status === "Funded") {
			toast.error("Cannot edit a funded pitch");
			return;
		}
		router.push(`/business/pitches/manage/${pitchId}/edit`);
	};

	const handleDistribute = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation();
		router.push(`/business/pitches/manage/${pitchId}/distribute`);
	};

	const handleDeclareProfit = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation();
		router.push(`/business/pitches/manage/${pitchId}/profit`);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">
							Manage Pitches
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							View, edit, and manage your active investment pitches.
						</p>
					</div>
					<Button
						className={`mt-6 md:mt-0 flex items-center gap-2 cursor-pointer`}
						onClick={() => router.push("/business/pitches/new")}
					>
						<Plus size={18} /> New Pitch
					</Button>
				</div>

				{/* ✅ Data Table */}
				<div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Title</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Raised</TableHead>
								<TableHead>Target</TableHead>
								<TableHead>Profit Share</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pitches.map((pitch) => {
								const canDeclareProfit =
									pitch.status === "Active" ||
									Number(pitch.raised_amount) >= Number(pitch.target_amount);

								return (
									<TableRow
										key={pitch.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
										onClick={() => router.push(`/pitches/${pitch.id}`)}
									>
										<TableCell className="pl-4 font-medium">{pitch.title}</TableCell>
										<TableCell>
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
										</TableCell>
										<TableCell>£{pitch.raised_amount}</TableCell>
										<TableCell>£{pitch.target_amount}</TableCell>
										<TableCell>{pitch.profit_share_percent}%</TableCell>
										<TableCell className="text-right flex justify-end gap-2">
											{/* distribute button */}
											{pitch.status === "Funded" && (
												<Button
													className={`flex items-center gap-1 text-sm`}
													onClick={(e) => handleDistribute(e, pitch.id)}
												>
													<DollarSign size={14} /> Distribute
												</Button>
											)}

											{/* declare profit button */}
											{canDeclareProfit && (
												<Button
													className={`flex items-center gap-1 text-sm cursor-pointer bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white`}
													onClick={(e) =>
														handleEdit(e, pitch.id, pitch.status)
													}
													disabled={pitch.status === "Funded"}
													variant="outline"
												>
													<Pencil size={14} /> Declare Profit
												</Button>
											)}

											{/* edit button */}
											<Button
												className={`flex items-center gap-1 text-sm cursor-pointer`}
												onClick={(e) =>
													handleEdit(e, pitch.id, pitch.status)
												}
												disabled={pitch.status === "Funded"}
												variant="outline"
											>
												<Pencil size={14} /> Edit
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
