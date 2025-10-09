"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	MoreHorizontal,
	DollarSign,
	ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { InvestmentFromApi } from "@/lib/types/investment";
import { Pitch } from "@/lib/types/pitch";
import { ProfitFromApi } from "@/lib/types/profit";
import { getInvestments } from "@/lib/api/investment";
import { getPitchById } from "@/lib/api/pitch";
import { getProfitsForPitch } from "@/lib/api/profit";
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
import { Button } from "@/components/ui/button";
import LoaderComponent from "@/components/Loader";
import { useAuthStore } from "@/lib/store/authStore";
import { getUserProfile } from "@/lib/api/profile";

// 🧮 Utility: currency formatting
const formatCurrency = (amount: number) => `£${Number(amount).toFixed(2)}`;

// 🧠 Extended investment type for UI
type InvestmentWithExtras = InvestmentFromApi & {
	pitch_title?: string;
	roi_percent?: number;
	total_profit_received?: number;
	target_amount?: number;
	raised_amount?: number;
	status?: string;
};

export default function ManageInvestmentsPage() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const [userProfile, setUserProfile] = useState<any>(null);
	const router = useRouter();

	const [userId, setUserId] = useState<string | null>(null);
	const [investments, setInvestments] = useState<InvestmentWithExtras[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// 🔒 Check authentication
	useEffect(() => {
		const verifyAuth = async () => await checkAuth();
		verifyAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!isCheckingAuth && !authUser) router.push("/");
	}, [authUser, isCheckingAuth, router]);

	useEffect(() => {
		if (authUser?.id) {
			getUserProfile(authUser.id).then(setUserProfile).catch(console.error);
		}
	}, [authUser?.id]);

	// 🔑 Get session for userId
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
				setError("Authentication failed. Please log in.");
			} finally {
				setLoading(false);
			}
		};
		getSession();
	}, [authUser?.id]);

	// 📊 Fetch user investments + pitch info + profits
	const fetchUserInvestments = async (id: string) => {
		try {
			setLoading(true);
			setError(null);

			const fetchedInvestments = await getInvestments();
			if (!Array.isArray(fetchedInvestments) || fetchedInvestments.length === 0) {
				setInvestments([]);
				return;
			}

			// Extract unique pitch IDs
			const pitchIds = [...new Set(fetchedInvestments.map((inv) => inv.pitch_id))];

			// Fetch all pitch data concurrently
			const pitchResults = await Promise.allSettled(
				pitchIds.map((pid) => getPitchById(pid))
			);

			const pitchMap = new Map<number, Pitch>();
			pitchResults.forEach((res, idx) => {
				if (res.status === "fulfilled") {
					pitchMap.set(pitchIds[idx], res.value as Pitch);
				}
			});

			// Fetch profits for each pitch to calculate ROI
			const profitResults = await Promise.allSettled(
				pitchIds.map((pid) => getProfitsForPitch(pid))
			);
			const profitMap = new Map<number, ProfitFromApi[]>();
			profitResults.forEach((res, idx) => {
				if (res.status === "fulfilled") {
					profitMap.set(pitchIds[idx], res.value as ProfitFromApi[]);
				}
			});

			// Enrich each investment
			const enriched = fetchedInvestments.map((inv) => {
				const pitch = pitchMap.get(inv.pitch_id);
				const profits = profitMap.get(inv.pitch_id) || [];

				// Sum total distributable profit for this pitch
				const totalProfit = profits.reduce(
					(sum, p) => sum + (p.distributable_amount || 0),
					0
				);

				// ROI = total distributed profit / invested amount * 100
				const roi = inv.amount > 0 ? (totalProfit / inv.amount) * 100 : 0;

				return {
					...inv,
					pitch_title: pitch?.title || `Pitch #${inv.pitch_id}`,
					target_amount: pitch?.target_amount,
					raised_amount: pitch?.raised_amount,
					status: pitch?.status,
					total_profit_received: totalProfit,
					roi_percent: roi,
				};
			});

			setInvestments(enriched);
		} catch (err) {
			console.error("Failed to fetch user investments:", err);
			toast.error("Failed to load your investments.");
			setInvestments([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (userId) fetchUserInvestments(userId);
	}, [userId]);

	// 🧭 Actions
	const handleViewPitch = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation();
		router.push(`/pitches/${pitchId}`);
	};

	const handleViewProfits = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation();
		router.push(`/pitches/${pitchId}/profits`);
	};

	// 🧱 UI States
	if (error)
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
				<h1 className="text-3xl font-bold text-red-600 mb-2">Error</h1>
				<p className="text-gray-600 dark:text-gray-400">{error}</p>
				<Button className="mt-6" onClick={() => window.location.reload()}>
					Try Again
				</Button>
			</div>
		);

	if (isCheckingAuth || loading)
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<LoaderComponent />
			</div>
		);

	if (investments.length === 0)
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-6">
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
					Manage Investments
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-6">
					You currently have no active investments.
				</p>
				<Button className="flex items-center gap-2" onClick={() => router.push("/pitches")}>
					<DollarSign size={14} /> Explore Pitches
				</Button>
			</div>
		);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">
							My Investments
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							View, track, and analyze the pitches you’ve invested in.
						</p>
					</div>
					<Button
						className="mt-6 md:mt-0 flex items-center gap-2 cursor-pointer"
						onClick={() => router.push("/pitches")}
					>
						<DollarSign size={14} /> Explore Pitches
					</Button>
				</div>

				<div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Pitch</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>ROI</TableHead>
								<TableHead>Total Profit</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Date</TableHead>
								<TableHead className="text-right"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{investments.map((inv) => (
								<TableRow key={inv.id}>
									<TableCell className="pl-4 font-medium">
										{inv.pitch_title}
									</TableCell>
									<TableCell>{formatCurrency(inv.amount)}</TableCell>
									<TableCell>
										{inv.roi_percent !== undefined
											? `${inv.roi_percent.toFixed(2)}%`
											: "—"}
									</TableCell>
									<TableCell>
										{formatCurrency(inv.total_profit_received || 0)}
									</TableCell>
									<TableCell>{inv.status || "—"}</TableCell>
									<TableCell>
										{new Date(inv.created_at).toLocaleDateString()}
									</TableCell>
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
													onClick={(e) => handleViewPitch(e, inv.pitch_id)}
													className="flex items-center gap-2"
												>
													<ExternalLink className="mr-2 h-4 w-4" />
													View Pitch Details
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={(e) => handleViewProfits(e, inv.pitch_id)}
													className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
												>
													<DollarSign className="mr-2 h-4 w-4" />
													View Profit History
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
