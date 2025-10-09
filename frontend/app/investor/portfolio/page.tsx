"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	MoreHorizontal,
	DollarSign,
	ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import LoaderComponent from "@/components/Loader";
import { useAuthStore } from "@/lib/store/authStore";
import { getPortfolio } from "@/lib/api/portfolio";
import { PortfolioItem } from "@/lib/types/portfolio";

const formatCurrency = (amount: number) =>
	`£${Number(amount).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;

export default function ManageInvestmentsPage() {
	const router = useRouter();
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!isCheckingAuth && !authUser) router.push("/");
	}, [authUser, isCheckingAuth, router]);

	const fetchPortfolio = async () => {
		try {
			setLoading(true);
			const data = await getPortfolio();
			setPortfolio(data.items || []);
		} catch (err: any) {
			console.error("Error fetching portfolio:", err);
			toast.error("Failed to load your portfolio data.");
			setError("Unable to fetch portfolio. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (authUser?.id) fetchPortfolio();
	}, [authUser?.id]);

	const handleViewPitch = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation();
		router.push(`/pitches/${pitchId}`);
	};

	const handleViewProfits = (e: React.MouseEvent, pitchId: number) => {
		e.stopPropagation();
		router.push(`/pitches/${pitchId}/profits`);
	};

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

	if (portfolio.length === 0)
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-6">
				<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
					My Portfolio
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mb-6">
					You currently have no active investments.
				</p>
				<Button
					className="flex items-center gap-2"
					onClick={() => router.push("/pitches")}
				>
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
							My Portfolio
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							View and analyze your current investments.
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
								<TableHead>Target</TableHead>
								<TableHead>Raised</TableHead>
								<TableHead>ROI</TableHead>
								<TableHead>Total Profit</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Date</TableHead>
								<TableHead className="text-right"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{portfolio.map((item) => (
								<TableRow key={item.investment_id}>
									<TableCell className="pl-4 font-medium">
										{item.pitch_title}
									</TableCell>
									<TableCell>{formatCurrency(item.target_amount)}</TableCell>
									<TableCell>{formatCurrency(item.raised_amount)}</TableCell>
									<TableCell>{(item.roi * 100).toFixed(2)}%</TableCell>
									<TableCell>{formatCurrency(item.total_profit)}</TableCell>
									<TableCell>{item.status}</TableCell>
									<TableCell>
										{new Date(item.created_at).toLocaleDateString()}
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													className="h-8 w-8 p-0 cursor-pointer"
													onClick={(e) => e.stopPropagation()}
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={(e) =>
														handleViewPitch(e, item.pitch_id)
													}
													className="flex items-center gap-2"
												>
													<ExternalLink className="mr-2 h-4 w-4" />
													View Pitch
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={(e) =>
														handleViewProfits(e, item.pitch_id)
													}
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
