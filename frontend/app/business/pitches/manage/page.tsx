"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	Pencil,
	DollarSign,
	Plus,
	PiggyBank,
	MoreHorizontal,
	Trash,
	Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getAllPitches } from "@/lib/api/pitch";
import { Pitch } from "@/lib/types/pitch";
import { declareProfit } from "@/lib/api/profit";
import { Profit } from "@/lib/types/profit";
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
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useAuthStore } from "@/lib/store/authStore";
import { getUserProfile } from "@/lib/api/profile";
import axios from "@/lib/axios";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PitchToDelete {
	id: number | null;
	title: string | null;
}

export default function ManagePitchesPage() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const [userProfile, setUserProfile] = useState<any>(null);
	const [isProfitDialogOpen, setIsProfitDialogOpen] = useState(false);
	const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
	const [profitAmount, setProfitAmount] = useState("");
	const [isDeclaring, setIsDeclaring] = useState(false);

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
	const [pitchToDelete, setPitchToDelete] = useState<PitchToDelete>({
		id: null,
		title: null,
	});
	const [isDeleting, setIsDeleting] = useState(false);

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

	const fetchUserPitches = async (id: string) => {
		try {
			setLoading(true);
			setError(null);
			const fetchedData = await getAllPitches(id);
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

	useEffect(() => {
		if (!userId) return;
		fetchUserPitches(userId);
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

	const handleEdit = (
		e: React.MouseEvent,
		pitchId: number,
		status: string
	) => {
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

	const handleDeclareProfit = (e: React.MouseEvent, pitch: Pitch) => {
		e.stopPropagation();
		setSelectedPitch(pitch);
		setIsProfitDialogOpen(true);
	};

	const handleDeleteClick = (e: React.MouseEvent, pitch: Pitch) => {
		e.stopPropagation();
		setPitchToDelete({ id: pitch.id, title: pitch.title });
	};

	const handleDeleteConfirm = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!pitchToDelete.id || !userId) return;

		setIsDeleting(true);
		try {
			await axios.delete(`/pitch?id=${pitchToDelete.id}`);
			toast(`Pitch '${pitchToDelete.title}' deleted successfully.`);

			await fetchUserPitches(userId);

			setPitchToDelete({ id: null, title: null });

		} catch (err) {
			console.error("Failed to delete pitch:", err);
			toast.error("Failed to delete pitch. Please try again.");
		} finally {
			setIsDeleting(false);
		}
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
									pitch.status !== "Declared";
									Number(pitch.raised_amount) >=
									Number(pitch.target_amount);

								const canDistributeProfit =
									pitch.status === "Declared";

								return (
									<TableRow key={pitch.id} className="">
										<TableCell className="pl-4 font-medium">
											{pitch.title}
										</TableCell>
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
										<TableCell>
											{pitch.profit_share_percent}%
										</TableCell>

										<TableCell className="text-right">
											<AlertDialog
												open={
													pitchToDelete.id ===
													pitch.id
												}
												onOpenChange={(isOpen) =>
													!isOpen &&
													setPitchToDelete({
														id: null,
														title: null,
													})
												}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															className="h-8 w-8 p-0 cursor-pointer"
															onClick={(e) =>
																e.stopPropagation()
															}
														>
															<span className="sr-only">
																Open menu
															</span>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuLabel>
															Actions
														</DropdownMenuLabel>
														<DropdownMenuSeparator />

														<DropdownMenuItem
															onClick={(e) =>
																handleEdit(
																	e,
																	pitch.id,
																	pitch.status
																)
															}
															disabled={
																pitch.status ===
																"Funded" ||
																pitch.status ===
																"Declared"
															}
															className={`flex items-center gap-2 ${pitch.status ===
																"Funded"
																? "opacity-50 cursor-not-allowed"
																: "cursor-pointer"
																}`}
														>
															<Pencil className="mr-2 h-4 w-4" />{" "}
															Edit Pitch
														</DropdownMenuItem>

														{canDeclareProfit && (
															<DropdownMenuItem
																onClick={(e) => handleDeclareProfit(e, pitch)}
																className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer"
															>
																<PiggyBank className="mr-2 h-4 w-4" />{" "}
																Declare Profit
															</DropdownMenuItem>
														)}

														{canDistributeProfit && (
															<DropdownMenuItem
																onClick={(e) =>
																	handleDistribute(
																		e,
																		pitch.id
																	)
																}
																className="flex items-center gap-2 cursor-pointer"
															>
																<DollarSign className="mr-2 h-4 w-4" />{" "}
																Distribute Profit
															</DropdownMenuItem>
														)}

														<DropdownMenuSeparator />

														<AlertDialogTrigger asChild>
															<DropdownMenuItem
																onClick={(e) =>
																	handleDeleteClick(
																		e,
																		pitch
																	)
																}
																className="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600"
															>
																<Trash className="mr-2 h-4 w-4" />{" "}
																Delete Pitch
															</DropdownMenuItem>
														</AlertDialogTrigger>
													</DropdownMenuContent>
												</DropdownMenu>

												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Are you absolutely sure?
														</AlertDialogTitle>
														<AlertDialogDescription>
															This action cannot be undone. This will
															permanently delete the pitch "
															<span className="font-semibold text-red-600 dark:text-red-400">
																{
																	pitchToDelete.title
																}
															</span>
															".
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel disabled={isDeleting}>
															Cancel
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={
																handleDeleteConfirm
															}
															className="bg-red-600 hover:bg-red-700 text-white"
															disabled={isDeleting}
														>
															{isDeleting ? (
																<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															) : (
																<Trash className="mr-2 h-4 w-4" />
															)}
															{isDeleting
																? "Deleting..."
																: "Delete Pitch"}
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>

					<Dialog open={isProfitDialogOpen} onOpenChange={setIsProfitDialogOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Declare Profit</DialogTitle>
								<DialogDescription>
									Enter the profit amount to declare for{" "}
									<span className="font-semibold text-gray-900 dark:text-white">
										{selectedPitch?.title}
									</span>
									.
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 mt-4">
								<div>
									<Label className="mb-2" htmlFor="profitAmount">Profit Amount (£)</Label>
									<Input
										id="profitAmount"
										type="text"
										inputMode="decimal"
										pattern="[0-9]*"
										value={profitAmount}
										onChange={(e) => {
											const value = e.target.value;
											// allow only digits + one optional decimal point
											if (/^\d*\.?\d*$/.test(value)) {
												setProfitAmount(value);
											}
										}}
										placeholder="Enter profit amount"
										className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
									/>
								</div>
							</div>

							<DialogFooter className="mt-6">
								<DialogClose asChild>
									<Button variant="outline">Cancel</Button>
								</DialogClose>
								<Button
									onClick={async () => {
										if (!selectedPitch || !profitAmount) {
											toast.error("Please enter a valid profit amount.");
											return;
										}
										setIsDeclaring(true);
										try {
											const profit: Profit = {
												pitch_id: selectedPitch.id,
												total_profit: Number(profitAmount),
												period_start: new Date().toISOString(),
												period_end: new Date().toISOString(),
											};
											await declareProfit(profit);
											toast.success("Profit declared successfully!");
											setIsProfitDialogOpen(false);
											setProfitAmount("");
											await fetchUserPitches(userId!); // refresh list
										} catch (err) {
											console.error("Error declaring profit:", err);
											toast.error("Failed to declare profit. Try again.");
										} finally {
											setIsDeclaring(false);
										}
									}}
									disabled={isDeclaring}
								>
									{isDeclaring ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Declaring...
										</>
									) : (
										"Declare Profit"
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</div>
	);
}
