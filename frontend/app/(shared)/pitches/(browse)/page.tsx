"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pitch } from "@/lib/types/pitch";
import { getPitches } from "@/lib/api/pitch";
import { useAuthStore } from "@/lib/store/authStore";
import { LoaderPinwheel } from "lucide-react";
import { PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

export default function BusinessPitchesPage() {
	const router = useRouter();
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
	type SortKey = "raisedDesc" | "raisedAsc" | "profitDesc" | "profitAsc" | "targetDesc" | "targetAsc" | "newest" | "oldest" | undefined;
	const [sortKey, setSortKey] = useState<SortKey>(undefined);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	const pageSize = 9;

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// redirect if already logged in
	useEffect(() => {
		if (!authUser) {
			router.push("/")
		}
	}, [authUser, router])

	// fetch pitches with filters, search, sort, pagination
	const fetchPitches = async (page = 1) => {
		try {
			setLoading(true);

			const { pitches: fetchedPitches, totalCount } = await getPitches({
				limit: pageSize,
				offset: (page - 1) * pageSize,
				search: searchQuery,
				status: selectedStatuses.length > 0 ? selectedStatuses.join(",") : undefined,
				sortKey,
			});

			setPitches(fetchedPitches);
			setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
			setCurrentPage(page);
		} catch (err) {
			console.error(err);
			toast.error("Failed to load pitches");
			setPitches([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!isCheckingAuth && authUser) fetchPitches(1);
	}, [authUser, isCheckingAuth, selectedStatuses, sortKey]);

	const handleSearchKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") fetchPitches(1);
	};

	const handleView = (pitchId: number) => router.push(`/pitches/${pitchId}`);
	const getFundingPercentage = (raised: number, target: number) =>
		target === 0 ? 0 : Math.min(Math.round((raised / target) * 100), 100);

	const getStatusClasses = (status: string) => {
		switch (status) {
			case "Active":
				return "border-2 border-green-500 text-green-600";
			case "Funded":
				return "border-2 border-blue-500 text-blue-600";
			case "Declared":
				return "border-2 border-blue-500 text-blue-600";
			case "Distributed":
				return "border-2 border-blue-500 text-blue-600";
			case "Draft":
				return "border-2 border-yellow-500 text-yellow-500";
			case "Closed":
				return "border-2 border-red-500 text-red-600";
			default:
				return "border-2 border-gray-500 text-gray-600";
		}
	};

	if (isCheckingAuth || !authUser || loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<LoaderPinwheel className="w-10 h-10 animate-spin" />
			</div>
		);
	}

	const toggleStatus = (status: string) => {
		setSelectedStatuses((prev) =>
			prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
		);
	};

	const renderPitchCard = (pitch: Pitch) => {
		const firstMedia = pitch.media?.[0];
		const isVideo = firstMedia?.media_type?.startsWith('video/');
		const mediaUrl = firstMedia?.url;

		return (
			<div
				key={pitch.id}
				className="group cursor-pointer bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-primary/50 transition-all duration-200 flex flex-col"
				onClick={() => handleView(pitch.id)}
			>
				<div className="w-full relative overflow-hidden bg-gray-200 dark:bg-gray-700">
					<div className="pt-[56.25%] flex items-center justify-center">

						{mediaUrl && isVideo ? (
							<video
								src={mediaUrl}
								className="absolute inset-0 w-full h-full object-cover"
								controls={true}
								poster={mediaUrl}
								loop={false}
								muted={false}
								playsInline
								preload="metadata"
								aria-label={`${pitch.title} video`}
							/>
						) : null}

						{mediaUrl && !isVideo ? (
							<img
								src={mediaUrl}
								alt={`${pitch.title} media preview`}
								className="absolute inset-0 w-full h-full object-cover"
							/>
						) : null}

						{!mediaUrl ? (
							<span className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
								Thumbnail
							</span>
						) : null}

					</div>
				</div>
				<div className="flex flex-col justify-between flex-1 p-4">
					<div className="flex justify-between items-center mb-2">
						<h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition">
							{pitch.title}
						</h2>
						<span
							className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
								pitch.status
							)}`}
						>
							{pitch.status === "Declared" || pitch.status === "Distributed" ? "Funded" : pitch.status}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<p className="text-sm text-gray-600 dark:text-gray-400">
							<span className="font-medium text-gray-800 dark:text-gray-200">Profit Share:</span>{" "}
							{pitch.profit_share_percent}%
						</p>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							<span className="font-medium text-gray-800 dark:text-gray-200">Raised: </span>
							<strong>£{pitch.raised_amount}</strong> / £{pitch.target_amount}
						</p>

						<div className="overflow-hidden max-h-0 group-hover:max-h-32 transition-all duration-300">
							<p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-4">
								<span className="font-medium text-gray-800 dark:text-gray-200">
									{pitch.elevator_pitch}
								</span>
							</p>
						</div>
					</div>
					<Progress
						value={getFundingPercentage(pitch.raised_amount, pitch.target_amount)}
						className="h-2 rounded-md mt-4"
					/>
				</div>
			</div>
		);
	};

	const getPageNumbers = (current: number, total: number, maxVisible = 5) => {
		const half = Math.floor(maxVisible / 2);
		let start = Math.max(1, current - half);
		let end = Math.min(total, current + half);

		if (end - start + 1 < maxVisible) {
			if (start === 1) end = Math.min(total, start + maxVisible - 1);
			else if (end === total) start = Math.max(1, end - maxVisible + 1);
		}

		return { start, end };
	};

	const { start, end } = getPageNumbers(currentPage, totalPages, 5);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">Browse Pitches</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							Explore all pitches available on the platform.
						</p>
					</div>

					<div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
						<Input
							placeholder="Search by title..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={handleSearchKeyPress}
							className="w-full md:w-64"
						/>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="w-full md:w-auto">
									Filter & Sort
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56">
								<DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
								{["Active", "Funded", "Draft", "Closed"].map((status) => (
									<DropdownMenuItem key={status} onClick={() => toggleStatus(status)}>
										<input
											type="checkbox"
											checked={selectedStatuses.includes(status)}
											readOnly
											className="mr-2"
										/>
										{status}
									</DropdownMenuItem>
								))}

								<DropdownMenuSeparator />

								<DropdownMenuLabel>Sort By</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => setSortKey("raisedDesc")}>Highest Raised Amount</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("raisedAsc")}>Lowest Raised Amount</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("profitDesc")}>Highest Profit Share</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("profitAsc")}>Lowest Profit Share</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("targetDesc")}>Highest Target Amount</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("targetAsc")}>Lowest Target Amount</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("newest")}>Newest</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("oldest")}>Oldest</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{pitches.length === 0 ? (
					<p className="text-gray-600 dark:text-gray-400">No pitches available.</p>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
							{pitches.map((pitch) => renderPitchCard(pitch))}
						</div>

						<div className="flex justify-center mt-10">
							<Pagination>
								<PaginationContent className="cursor-pointer">
									<PaginationItem>
										<PaginationPrevious onClick={() => currentPage > 1 && fetchPitches(currentPage - 1)} />
									</PaginationItem>

									{start > 1 && (
										<>
											<PaginationItem>
												<PaginationLink onClick={() => fetchPitches(1)}>1</PaginationLink>
											</PaginationItem>
											{start > 2 && <PaginationEllipsis />}
										</>
									)}

									{Array.from({ length: end - start + 1 }, (_, i) => {
										const pageNum = start + i;
										return (
											<PaginationItem key={pageNum} className="cursor-pointer">
												<PaginationLink
													onClick={() => fetchPitches(pageNum)}
													isActive={currentPage === pageNum}
												>
													{pageNum}
												</PaginationLink>
											</PaginationItem>
										);
									})}

									{end < totalPages && (
										<>
											{end < totalPages - 1 && <PaginationEllipsis />}
											<PaginationItem>
												<PaginationLink onClick={() => fetchPitches(totalPages)}>{totalPages}</PaginationLink>
											</PaginationItem>
										</>
									)}

									<PaginationItem className="cursor-pointer">
										<PaginationNext onClick={() => currentPage < totalPages && fetchPitches(currentPage + 1)} />
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
