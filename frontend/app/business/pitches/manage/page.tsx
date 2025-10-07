"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
	Pencil,
	DollarSign,
	Plus,
	PiggyBank,
	MoreHorizontal,
	Trash,
} from "lucide-react";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/authStore";
import { getUserProfile } from "@/lib/api/profile";
import axios from "@/lib/axios";

export default function ManagePitchesPage() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const [userProfile, setUserProfile] = useState<any>(null);

	const router = useRouter();

	// fetch profile on mount
	useEffect(() => {
		const fetchProfile = async () => {
			console.log(authUser);
			if (authUser?.id) {
				try {
					const profile = await getUserProfile(authUser.id);
					setUserProfile(profile);
				} catch (err) {
					console.error("Failed to fetch user profile:", err);
				}
			}
		};
		fetchProfile();
	}, [authUser?.id]);

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth();
		};
		verifyAuth();
	}, [checkAuth]);

	// redirect if not logged in
	useEffect(() => {
		if (!isCheckingAuth && !authUser) {
			router.push("/");
		}
	}, [authUser, router, isCheckingAuth]);

	const [userId, setUserId] = useState<string | null>(null);
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const getSession = async () => {
			setLoading(true);
			try {
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();
				if (error) throw error;
				setUserId(authUser?.id || session?.user?.id || null);
			} catch (e) {
				console.error("Supabase Auth Error:", e);
				setUserId(null);
				setError("Authentication failed. Please log in.");
			} finally {
				setLoading(false);
			}
		};
		getSession();
	}, [authUser?.id]);

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

	const getStatusClasses = (status: string) => {
		switch (status) {
			case "Active":
				return "border-2 border-green-500 text-green-600";
			case "Funded":
				return "border-2 border-blue-500 text-blue-600";
			case "Declared":
				return "border-2 border-brown-500 text-brown-600";
			case "Draft":
				return "border-2 border-yellow-500 text-yellow-500";
			case "Closed":
				return "border-2 border-red-500 text-red-600";
			default:
				return "border-2 border-gray-500 text-gray-600";
		}
	};

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

	const handleDelete = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation();
		axios.delete(`/pitch?id=${pitchId}`);
	};

	const handleDeleteConfirm = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation();
	};

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

	if (isCheckingAuth || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<LoaderComponent />
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

				{/* --- */}

				{/* Data Table */}
				<div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Title</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Raised</TableHead>
								<TableHead>Target</TableHead>
								<TableHead>Profit Share</TableHead>
								<TableHead className="text-right w-[50px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pitches.map((pitch) => {
								const canDeclareProfit =
									pitch.status === "Funded" ||
									Number(pitch.raised_amount) >= Number(pitch.target_amount);

								const canDistributeProfit = pitch.status === "Declared"

								return (
									<TableRow
										key={pitch.id}
										className=""
									>
										<TableCell className="pl-4 font-medium">{pitch.title}</TableCell>
										<TableCell>
											<span
												className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
													pitch.status
												)}`}
											>
												{pitch.status}
											</span>
										</TableCell>
										<TableCell>£{pitch.raised_amount}</TableCell>
										<TableCell>£{pitch.target_amount}</TableCell>
										<TableCell>{pitch.profit_share_percent}%</TableCell>

										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														className="h-8 w-8 p-0 cursor-pointer"
														onClick={(e) => e.stopPropagation()}
													>
														<span className="sr-only">Open menu</span>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													<DropdownMenuSeparator />

													<DropdownMenuItem
														onClick={(e) =>
															handleEdit(e, pitch.id, pitch.status)
														}
														disabled={pitch.status === "Funded" || pitch.status === "Declared"}
														className={`flex items-center gap-2 ${pitch.status === "Funded" ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
													>
														<Pencil className="mr-2 h-4 w-4" /> Edit Pitch
													</DropdownMenuItem>

													{canDeclareProfit && (
														<DropdownMenuItem
															onClick={(e) =>
																handleDeclareProfit(e, pitch.id)
															}
															className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer"
														>
															<PiggyBank className="mr-2 h-4 w-4" /> Declare Profit
														</DropdownMenuItem>
													)}

													{canDistributeProfit && (
														<DropdownMenuItem
															onClick={(e) => handleDistribute(e, pitch.id)}
															className="flex items-center gap-2 cursor-pointer"
														>
															<DollarSign className="mr-2 h-4 w-4" /> Distribute Profit
														</DropdownMenuItem>
													)}

													<DropdownMenuSeparator />

													{/* delete pitch button */}
													<DropdownMenuItem
														onClick={(e) => handleDelete(e, pitch.id)}
														className="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600"
													>
														<Trash className="mr-2 h-4 w-4" /> Delete Pitch
													</DropdownMenuItem>

												</DropdownMenuContent>
											</DropdownMenu>
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
