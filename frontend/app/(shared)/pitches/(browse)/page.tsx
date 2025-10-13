"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pitch } from "@/lib/types/pitch";
import { getPitches } from "@/lib/api/pitch";
import { useAuthStore } from "@/lib/store/authStore";
import { LoaderPinwheel } from "lucide-react";
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
	// state for fetched pitches, loading status, and UI controls
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
	type SortKey = "raisedDesc" | "raisedAsc" | "profitDesc" | "profitAsc" | "targetDesc" | "targetAsc" | "newest" | "oldest" | undefined;
	const [sortKey, setSortKey] = useState<SortKey>(undefined);
	const [searchQuery, setSearchQuery] = useState<string>("");
	// state for pagination
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	const pageSize = 9;

	// auth check on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// redirect if user is not authenticated
	useEffect(() => {
		if (!authUser) {
			router.push("/")
		}
	}, [authUser, router])

	// fetches pitches from api using current filters, sort, and pagination
	const fetchPitches = async (page = 1) => {
		try {
			setLoading(true);

			// construct api request with limit, offset, search, status, and sort key
			const { pitches: fetchedPitches, totalCount } = await getPitches({
				limit: pageSize,
				offset: (page - 1) * pageSize,
				search: searchQuery,
				status: selectedStatuses.length > 0 ? selectedStatuses.join(",") : undefined,
				sortKey,
			});

			// update pitch data and pagination state
			setPitches(fetchedPitches);
			setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
			setCurrentPage(page);
		} catch (err) {
			console.error(err);
			toast.error("failed to load pitches");
			setPitches([]);
		} finally {
			setLoading(false);
		}
	};

	// re-fetch pitches when auth completes or when filters/sort change
	useEffect(() => {
		if (!isCheckingAuth && authUser) fetchPitches(1);
	}, [authUser, isCheckingAuth, selectedStatuses, sortKey]);

	// trigger search when user presses enter in input field
	const handleSearchKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") fetchPitches(1);
	};

	// navigation function to view specific pitch details
	const handleView = (pitchId: number) => router.push(`/pitches/${pitchId}`);

	// utility function to calculate funding progress percentage
	const getFundingPercentage = (raised: number, target: number) =>
		target === 0 ? 0 : Math.min(Math.round((raised / target) * 100), 100);

	// utility function to return tailwind classes for status badge styling
	const getStatusClasses = (status: string) => {
		switch (status) {
			case "Active":
				return "border-2 border-green-500 text-green-600";
			case "Funded":
			case "Declared":
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

	// display loading state while checking auth or fetching data
	if (isCheckingAuth || !authUser || loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<LoaderPinwheel className="w-10 h-10 animate-spin" />
			</div>
		);
	}

	// adds or removes status from filter list
	const toggleStatus = (status: string) => {
		setSelectedStatuses((prev) =>
			prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
		);
	};

	// renders individual pitch card component
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
				{/* media container (video or image) */}
				<div className="w-full relative overflow-hidden bg-gray-200 dark:bg-gray-700">
					<div className="pt-[56.25%] flex items-center justify-center">

						{/* render video tag if media is available and is video type */}
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

						{/* render image tag if media is available and is not video type */}
						{mediaUrl && !isVideo ? (
							<img
								src={mediaUrl}
								alt={`${pitch.title} media preview`}
								className="absolute inset-0 w-full h-full object-cover"
							/>
						) : null}

						{/* fallback for no media */}
						{!mediaUrl ? (
							<span className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
								thumbnail
							</span>
						) : null}

					</div>
				</div>
				{/* pitch details and progress bar */}
				<div className="flex flex-col justify-between flex-1 p-4">
					<div className="flex justify-between items-center mb-2">
						<h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition">
							{pitch.title}
						</h2>
						{/* status badge */}
						<span
							className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
								pitch.status
							)}`}
						>
							{pitch.status === "declared" || pitch.status === "distributed" ? "funded" : pitch.status.toLowerCase()}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						{/* profit share details */}
						<p className="text-sm text-gray-600 dark:text-gray-400">
							<span className="font-medium text-gray-800 dark:text-gray-200">profit share:</span>{" "}
							{pitch.profit_share_percent}%
						</p>
						{/* amount raised details */}
						<p className="text-sm text-gray-600 dark:text-gray-400">
							<span className="font-medium text-gray-800 dark:text-gray-200">raised: </span>
							<strong>£{pitch.raised_amount}</strong> / £{pitch.target_amount}
						</p>

						{/* elevator pitch preview on hover */}
						<div className="overflow-hidden max-h-0 group-hover:max-h-32 transition-all duration-300">
							<p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-4">
								<span className="font-medium text-gray-800 dark:text-gray-200">
									{pitch.elevator_pitch}
								</span>
							</p>
						</div>
					</div>
					{/* funding progress bar */}
					<Progress
						value={getFundingPercentage(pitch.raised_amount, pitch.target_amount)}
						className="h-2 rounded-md mt-4"
					/>
				</div>
			</div>
		);
	};

	// calculates which page numbers should be visible in the pagination component
	const getPageNumbers = (current: number, total: number, maxVisible = 5) => {
		const half = Math.floor(maxVisible / 2);
		let start = Math.max(1, current - half);
		let end = Math.min(total, current + half);

		// adjust start/end if range is too small at boundaries
		if (end - start + 1 < maxVisible) {
			if (start === 1) end = Math.min(total, start + maxVisible - 1);
			else if (end === total) start = Math.max(1, end - maxVisible + 1);
		}

		return { start, end };
	};

	// calculate visible page range
	const { start, end } = getPageNumbers(currentPage, totalPages, 5);

	// main page layout
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-7xl mx-auto">
				{/* header, search, filter, and sort controls */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">browse pitches</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							explore all pitches available on platform.
						</p>
					</div>

					<div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
						{/* search input */}
						<Input
							placeholder="search by title..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={handleSearchKeyPress}
							className="w-full md:w-64"
						/>

						{/* filter and sort dropdown menu */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="w-full md:w-auto">
									filter & sort
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56">
								<DropdownMenuLabel>filter by status</DropdownMenuLabel>
								{/* status filter items */}
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

								<DropdownMenuLabel>sort by</DropdownMenuLabel>
								{/* sort options */}
								<DropdownMenuItem onClick={() => setSortKey("raisedDesc")}>highest raised amount</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("raisedAsc")}>lowest raised amount</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("profitDesc")}>highest profit share</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("profitAsc")}>lowest profit share</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("targetDesc")}>highest target amount</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("targetAsc")}>lowest target amount</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("newest")}>newest</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("oldest")}>oldest</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* pitch list display */}
				{pitches.length === 0 ? (
					<p className="text-gray-600 dark:text-gray-400">no pitches available.</p>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
							{pitches.map((pitch) => renderPitchCard(pitch))}
						</div>

						{/* pagination controls */}
						<div className="flex justify-center mt-10">
							<Pagination>
								<PaginationContent className="cursor-pointer">
									<PaginationItem>
										<PaginationPrevious onClick={() => currentPage > 1 && fetchPitches(currentPage - 1)} />
									</PaginationItem>

									{/* first page and ellipsis logic */}
									{start > 1 && (
										<>
											<PaginationItem>
												<PaginationLink onClick={() => fetchPitches(1)}>1</PaginationLink>
											</PaginationItem>
											{start > 2 && <PaginationEllipsis />}
										</>
									)}

									{/* visible page numbers */}
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

									{/* last page and ellipsis logic */}
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
