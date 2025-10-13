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
	ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; 
import { getAllPitches } from "@/lib/api/pitch"; 
import { Pitch } from "@/lib/types/pitch"; 
import { declareProfit, distributeProfit, getProfitsForPitch } from "@/lib/api/profit"; 
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
} from "@/components/ui/alert-dialog"; // import omitted as per instruction

// interface for pitch data required for deletion confirmation
interface PitchToDelete {
	id: number | null;
	title: string | null;
}

// main component for pitch management page
export default function ManagePitchesPage() {
	// access authentication store state and actions
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	// state to store authenticated users profile data
	const [userProfile, setUserProfile] = useState<any>(null);
	// state to manage visibility of declare profit dialog
	const [isProfitDialogOpen, setIsProfitDialogOpen] = useState(false);
	// state to hold pitch object selected for profit declaration
	const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
	// state to capture profit amount input
	const [profitAmount, setProfitAmount] = useState("");
	// state to show loading status during profit declaration
	const [isDeclaring, setIsDeclaring] = useState(false);
	// state to manage visibility of profit distribution dialog
	const [isDistributeDialogOpen, setIsDistributeDialogOpen] = useState(false);
	// state to hold pitch object selected for profit distribution
	const [selectedDistributePitch, setSelectedDistributePitch] = useState<Pitch | null>(null);
	// state to show loading status during profit distribution
	const [isDistributing, setIsDistributing] = useState(false);
	const router = useRouter(); 

	// fetch profile on component mount or when authuser id changes
	useEffect(() => {
		const fetchProfile = async () => {
			console.log(authUser);
			// only proceed if authuser id is available
			if (authUser?.id) {
				try {
					// fetch profile using authuser id
					const profile = await getUserProfile(authUser.id);
					setUserProfile(profile);
				} catch (err) {
					console.error("failed to fetch user profile:", err);
				}
			}
		};
		fetchProfile();
	}, [authUser?.id]); // dependencies array: refetch if authuser id changes

	// check authentication status on component mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth();
		};
		verifyAuth();
	}, [checkAuth]); // dependency array: run once and on checkauth change

	// redirect user if not logged in after auth check is complete
	useEffect(() => {
		if (!isCheckingAuth && !authUser) {
			router.push("/");
		}
	}, [authUser, isCheckingAuth]); // dependencies array: run when auth or checkauth status changes

	// state to store current user id
	const [userId, setUserId] = useState<string | null>(null);
	// state to store list of pitches fetched from api
	const [pitches, setPitches] = useState<Pitch[]>([]);
	// state to control main data loading indicator
	const [loading, setLoading] = useState(true);
	// state to hold any error message during data fetching
	const [error, setError] = useState<string | null>(null);
	// state for pitch currently selected for deletion confirmation dialog
	const [pitchToDelete, setPitchToDelete] = useState<PitchToDelete>({
		id: null,
		title: null,
	});
	// state to show loading status during pitch deletion
	const [isDeleting, setIsDeleting] = useState(false);

	// effect to retrieve user session and set user id
	useEffect(() => {
		const getSession = async () => {
			setLoading(true);
			try {
				// get current session from supabase auth
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();
				if (error) throw error;
				// set user id from authstore or session
				setUserId(authUser?.id || session?.user?.id || null);
			} catch (e) {
				console.error("supabase auth error:", e);
				setUserId(null);
				setError("authentication failed. please log in.");
			} finally {
				setLoading(false);
			}
		};
		getSession();
	}, [authUser?.id]); // run when authuser id changes

	// function to fetch user pitches
	const fetchUserPitches = async (id: string) => {
		try {
			setLoading(true);
			setError(null);
			// call api to get all pitches for user id
			const fetchedData = await getAllPitches(id);
			// ensure data is array before setting state, default to empty array
			setPitches(Array.isArray(fetchedData) ? fetchedData : []);
		} catch (err: any) {
			console.error("failed to fetch user pitches:", err);
			toast.error("failed to load your pitches.");
			setError("could not load pitches due to a server error.");
			setPitches([]);
		} finally {
			setLoading(false);
		}
	};

	// effect to fetch pitches once user id is available
	useEffect(() => {
		if (!userId) return;
		fetchUserPitches(userId);
	}, [userId]); // run when user id is set

	// utility function to determine css classes based on pitch status
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

	// handler for viewing pitch details
	const handleView = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation(); // prevent row click actions if any
		router.push(`/pitches/${pitchId}`);
	};

	// handler for editing a pitch
	const handleEdit = (
		e: React.MouseEvent,
		pitchId: number,
		status: string
	) => {
		e.stopPropagation(); // prevent row click actions if any
		// prevent editing funded pitches
		if (status === "Funded") {
			toast.error("cannot edit a funded pitch");
			return;
		}
		router.push(`/business/pitches/manage/${pitchId}/edit`);
	};

	// handler for opening distribute profit dialog
	const handleDistributeProfit = (e: React.MouseEvent, pitch: Pitch) => {
		e.stopPropagation(); // prevent row click actions if any
		setSelectedDistributePitch(pitch);
		setIsDistributeDialogOpen(true);
	};

	// handler for opening declare profit dialog
	const handleDeclareProfit = (e: React.MouseEvent, pitch: Pitch) => {
		e.stopPropagation(); // prevent row click actions if any
		setSelectedPitch(pitch);
		setIsProfitDialogOpen(true);
	};

	// handler for setting pitch to delete and opening alert dialog
	const handleDeleteClick = (e: React.MouseEvent, pitch: Pitch) => {
		e.stopPropagation(); // prevent row click actions if any
		setPitchToDelete({ id: pitch.id, title: pitch.title });
	};

	// handler for confirming and executing pitch deletion
	const handleDeleteConfirm = async (e: React.MouseEvent) => {
		e.stopPropagation(); // prevent multiple clicks
		if (!pitchToDelete.id || !userId) return; // guard clause

		setIsDeleting(true); // set loading state
		try {
			// call api endpoint to delete pitch
			await axios.delete(`/pitch?id=${pitchToDelete.id}`);
			toast(`pitch '${pitchToDelete.title}' deleted successfully.`);

			// refetch pitches to update list
			await fetchUserPitches(userId);

			// clear deletion state
			setPitchToDelete({ id: null, title: null });

		} catch (err) {
			console.error("failed to delete pitch:", err);
			toast.error("failed to delete pitch. please try again.");
		} finally {
			setIsDeleting(false); // unset loading state
		}
	};

	// render error state ui
	if (error) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
				<h1 className="text-3xl font-bold text-red-600 mb-2">error</h1>
				<p className="text-gray-600 dark:text-gray-400">{error}</p>
				<Button
					className={`mt-6`}
					onClick={() => window.location.reload()}
				>
					try again
				</Button>
			</div>
		);
	}

	// render loading state ui
	if (isCheckingAuth || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<LoaderComponent />
			</div>
		);
	}

	// render no pitches state ui
	if (pitches.length === 0) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-6">
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
					manage pitches
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-6">
					you currently have no pitches created yet.
				</p>
				<Button
					className={`flex items-center gap-2`}
				  onClick={() => router.push("/business/pitches/new")}
				>
					<Plus size={18} /> create new pitch
				</Button>
			</div>
		);
	}

	// main component render for list of pitches
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">
							manage pitches
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							view, edit, and manage your active investment pitches.
						</p>
					</div>
					<Button
						className={`mt-6 md:mt-0 flex items-center gap-2 cursor-pointer`}
					  onClick={() => router.push("/business/pitches/new")}
					>
						<Plus size={18} /> new pitch
					</Button>
				</div>

				<div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">title</TableHead>
								<TableHead>status</TableHead>
								<TableHead>raised</TableHead>
								<TableHead>target</TableHead>
								<TableHead>profit share</TableHead>
								<TableHead className="text-right w-[50px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{/* iterate over pitches and render a row for each */}
							{pitches.map((pitch) => {
								// determine if pitch can be edited
								const canEditPitch = pitch.status === "Active" || pitch.status === "Draft";

								// determine if profit can be declared
								const canDeclareProfit =
									pitch.status === "Funded";

								// determine if declared profit can be distributed
								const canDistributeProfit =
									pitch.status === "Declared";

								return (
									<TableRow key={pitch.id} className="">
										<TableCell className="pl-4 font-medium">
											{pitch.title}
										</TableCell>
										<TableCell>
											{/* display pitch status with colour coding */}
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
											{/* alert dialog for delete confirmation */}
											<AlertDialog
												// control visibility based on if current pitch is selected for deletion
												open={
													pitchToDelete.id ===
													pitch.id
												}
												// handler to close and reset pitchtodelete state
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
														{/* button to open pitch action menu */}
														<Button
															variant="ghost"
															className="h-8 w-8 p-0 cursor-pointer"
															onClick={(e) =>
																e.stopPropagation()
															}
														>
															<span className="sr-only">
																open menu
															</span>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuLabel>
															actions
														</DropdownMenuLabel>

														<DropdownMenuSeparator />

														{/* menu item to view pitch details */}
														<DropdownMenuItem
															onClick={(e) => handleView(e, pitch.id)}
															className="flex items-center gap-2 cursor-pointer"
														>
															<ExternalLink className="mr-2 h-4 w-4" />
															view pitch details
														</DropdownMenuItem>

														{/* menu item to edit pitch, visible only if editable */}
														{canEditPitch && (
															<DropdownMenuItem
																onClick={(e) =>
																	handleEdit(
																		e,
																		pitch.id,
																		pitch.status
																	)
																}
																className={`flex items-center gap-2 ${pitch.status ===
																	"Funded"
																	? "opacity-50 cursor-not-allowed"
																	: "cursor-pointer"
																	}`}
															>
																<Pencil className="mr-2 h-4 w-4" />{" "}
																edit pitch
															</DropdownMenuItem>
														)}

														{/* menu item to declare profit, visible only if funded */}
														{canDeclareProfit && (
															<DropdownMenuItem
																onClick={(e) => handleDeclareProfit(e, pitch)}
																className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer"
															>
																<PiggyBank className="mr-2 h-4 w-4" />{" "}
																declare profit
															</DropdownMenuItem>
														)}

														{/* menu item to distribute profit, visible only if declared */}
														{canDistributeProfit && (
															<DropdownMenuItem
																onClick={(e) => handleDistributeProfit(e, pitch)}
																className="flex items-center gap-2 cursor-pointer"
															>
																<DollarSign className="mr-2 h-4 w-4" /> distribute profit
															</DropdownMenuItem>
														)}

														{/* trigger for the alert dialog to confirm deletion */}
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
																delete pitch
															</DropdownMenuItem>
														</AlertDialogTrigger>
													</DropdownMenuContent>
												</DropdownMenu>

												{/* delete confirmation alert dialog content */}
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															are you absolutely sure?
														</AlertDialogTitle>
														<AlertDialogDescription>
															this action cannot be undone. this will
															permanently delete pitch "
															<span className="font-semibold text-red-600 dark:text-red-400">
																{
																	pitchToDelete.title
																}
															</span>
															".
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														{/* cancel button in delete confirmation */}
														<AlertDialogCancel disabled={isDeleting}>
															cancel
														</AlertDialogCancel>
														{/* confirm delete button with loading state */}
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
																? "deleting..."
																: "delete pitch"}
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

					{/* dialog for declaring profit */}
					<Dialog open={isProfitDialogOpen} onOpenChange={setIsProfitDialogOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>declare profit</DialogTitle>
								<DialogDescription>
									enter profit amount to declare for{" "}
									<span className="font-semibold text-gray-900 dark:text-white">
										{selectedPitch?.title}
									</span>
									.
								</DialogDescription>
							</DialogHeader>

							{/* profit input form */}
							<div className="space-y-4 mt-4">
								<div>
									<Label className="mb-2" htmlFor="profitAmount">profit amount (£)</Label>
									<Input
										id="profitAmount"
										type="text"
										inputMode="decimal"
										pattern="[0-9]*" // pattern attribute for numeric input
										value={profitAmount}
										// handler to ensure input is a valid decimal number
										onChange={(e) => {
											const value = e.target.value;
											if (/^\d*\.?\d*$/.test(value)) {
												setProfitAmount(value);
											}
										}}
										placeholder="enter profit amount"
										// css classes to hide default number input controls
										className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
									/>
								</div>
							</div>

							<DialogFooter className="mt-6">
								<DialogClose asChild>
									<Button variant="outline">cancel</Button>
								</DialogClose>
								{/* button to submit profit declaration */}
								<Button
									onClick={async () => {
										// validation check
										if (!selectedPitch || !profitAmount) {
											toast.error("please enter a valid profit amount.");
											return;
										}
										setIsDeclaring(true); // set loading state
										try {
											// construct profit object for api call
											const profit: Profit = {
												pitch_id: selectedPitch.id,
												total_profit: Number(profitAmount),
												// using current timestamp for start and end period for simplification
												period_start: new Date().toISOString(),
												period_end: new Date().toISOString(),
											};
											// declare profit via api
											await declareProfit(profit);
											toast.success("profit declared successfully!");
											setIsProfitDialogOpen(false); // close dialog
											setProfitAmount(""); // reset input
											// refresh pitch list
											await fetchUserPitches(userId!);
										} catch (err) {
											console.error("error declaring profit:", err);
											toast.error("failed to declare profit. try again.");
										} finally {
											setIsDeclaring(false); // unset loading state
										}
									}}
									disabled={isDeclaring} // disable button during api call
								>
									{isDeclaring ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											declaring...
										</>
									) : (
										"declare profit"
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{/* dialog for distributing profit */}
					<Dialog open={isDistributeDialogOpen} onOpenChange={setIsDistributeDialogOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>distribute profit</DialogTitle>
								<DialogDescription>
									this will distribute profits for{" "}
									<span className="font-semibold text-gray-900 dark:text-white">
										{selectedDistributePitch?.title}
									</span>
									.
								</DialogDescription>
							</DialogHeader>

							<DialogFooter className="mt-6">
								<DialogClose asChild>
									<Button variant="outline">cancel</Button>
								</DialogClose>
								{/* button to submit profit distribution */}
								<Button
									onClick={async () => {
										if (!selectedDistributePitch) return; // guard clause
										setIsDistributing(true); // set loading state
										try {
											// fetch all profits for pitch
											const profits = await getProfitsForPitch(selectedDistributePitch.id);
											// find oldest undistributed profit record
											const profitToDistribute = profits
												.filter(p => !p.transferred)
												.sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())[0];

											// handle case where no undistributed profit is found
											if (!profitToDistribute) {
												toast.error("no undistributed profit found for this pitch.");
												setIsDistributing(false);
												return;
											}

											// distribute profit via api
											await distributeProfit(profitToDistribute);
											toast.success("profit distributed successfully!");
											setIsDistributeDialogOpen(false); // close dialog
											// refresh pitch list
											await fetchUserPitches(userId!);
										} catch (err) {
											console.error("error distributing profit:", err);
											toast.error("failed to distribute profit. try again.");
										} finally {
											setIsDistributing(false); // unset loading state
										}
									}}
									disabled={isDistributing} // disable button during api call
								>
									{isDistributing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											distributing...
										</>
									) : (
										"distribute profit"
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
