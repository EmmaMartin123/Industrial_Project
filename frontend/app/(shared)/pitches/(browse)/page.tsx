"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Pitch, InvestmentTier } from "@/lib/types/pitch";
import { getAllPitches } from "@/lib/api/pitch";
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

import * as Button from "@/components/Button";

export default function BusinessPitchesPage() {
	const router = useRouter();
	const [pitches, setPitches] = useState<Pitch[]>([]);
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState<string | null>(null);
	const [sortKey, setSortKey] = useState<"raisedDesc" | "raisedAsc" | "profitDesc" | "profitAsc" | "newest" | "oldest" | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>("");

	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	// auth checks
	useEffect(() => { checkAuth(); }, [checkAuth]);
	useEffect(() => { if (!isCheckingAuth && !authUser) router.push("/login"); }, [authUser, isCheckingAuth, router]);

	// fetch pitches (all initially)
	const fetchPitches = async (search?: string) => {
		try {
			setLoading(true);
			let data;
			if (search && search.trim() !== "") {
				const res = await axios.get(`/pitch?search=${encodeURIComponent(search)}`);
				data = res.data;
			} else {
				data = await getAllPitches();
			}
			const mappedPitches: Pitch[] = (Array.isArray(data) ? data : []).map((p: any) => ({
				pitch_id: p.id,
				title: p.title,
				elevator_pitch: p.elevator_pitch,
				detailed_pitch: p.detailed_pitch,
				target_amount: p.target_amount,
				raised_amount: p.raised_amount ?? 0,
				profit_share_percent: p.profit_share_percent,
				status: p.status,
				investment_start_date: new Date(p.investment_start_date),
				investment_end_date: new Date(p.investment_end_date),
				created_at: new Date(p.created_at ?? Date.now()),
				updated_at: new Date(p.updated_at ?? Date.now()),
				investment_tiers: p.investment_tiers as InvestmentTier[],
			}));
			setPitches(mappedPitches);
		} catch (err) {
			console.error(err);
			toast.error("Failed to load pitches");
			setPitches([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!isCheckingAuth && authUser) fetchPitches();
	}, [authUser, isCheckingAuth]);

	// filter and sort
	const getFilteredSortedPitches = () => {
		let temp = [...pitches];
		if (filterStatus) temp = temp.filter(p => p.status === filterStatus);

		if (sortKey) {
			switch (sortKey) {
				case "raisedDesc": temp.sort((a, b) => b.raised_amount - a.raised_amount); break;
				case "raisedAsc": temp.sort((a, b) => a.raised_amount - b.raised_amount); break;
				case "profitDesc": temp.sort((a, b) => b.profit_share_percent - a.profit_share_percent); break;
				case "profitAsc": temp.sort((a, b) => a.profit_share_percent - b.profit_share_percent); break;
				case "newest": temp.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()); break;
				case "oldest": temp.sort((a, b) => a.created_at.getTime() - b.created_at.getTime()); break;
			}
		}

		return temp;
	};

	// trigger search on enter
	const handleSearchKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") fetchPitches(searchQuery);
	};

	if (isCheckingAuth || !authUser || loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<LoaderPinwheel className="w-10 h-10 animate-spin" />
			</div>
		);
	}

	const handleView = (pitchId: number) => router.push(`/pitches/${pitchId}`);

	const getFundingPercentage = (raised: number, target: number) => target === 0 ? 0 : Math.min(Math.round((raised / target) * 100), 100);

	const getStatusClasses = (status: string) => {
		switch (status) {
			case "Active": return "bg-green-500 text-white";
			case "Funded": return "bg-blue-500 text-white";
			case "Draft": return "bg-yellow-500 text-white";
			case "Closed": return "bg-red-500 text-white";
			default: return "bg-gray-500 text-white";
		}
	};

	const renderPitchCard = (pitch: Pitch, isFeatured = false) => (
		<div
			key={pitch.pitch_id}
			className={`${isFeatured ? "lg:col-span-4 row-span-2" : "lg:col-span-2"} group cursor-pointer bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-primary/50 transition-all duration-200 flex flex-col`}
			onClick={() => handleView(pitch.pitch_id)}
		>
			<div className="w-full relative overflow-hidden bg-gray-200 dark:bg-gray-700">
				<div className={`${isFeatured ? "pt-[50%]" : "pt-[45%]"} flex items-center justify-center`}>
					<span className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
						Thumbnail
					</span>
				</div>
			</div>
			<div className="flex flex-col justify-between flex-1 p-4">
				<div className="flex justify-between items-center mb-2">
					<h2 className={`${isFeatured ? "text-2xl" : "text-lg"} font-bold text-gray-900 dark:text-white group-hover:text-primary transition`}>
						{pitch.title}
					</h2>
					<span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(pitch.status)}`}>
						{pitch.status}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<p className="text-sm text-gray-600 dark:text-gray-400">
						<span className="font-medium text-gray-800 dark:text-gray-200">Raised:</span> £{pitch.raised_amount} / £{pitch.target_amount}
					</p>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						<span className="font-medium text-gray-800 dark:text-gray-200">Profit Share:</span> {pitch.profit_share_percent}%
					</p>
				</div>
				<Progress value={getFundingPercentage(pitch.raised_amount, pitch.target_amount)} className="h-2 rounded-md mt-4" />
			</div>
		</div>
	);

	const filteredSortedPitches = getFilteredSortedPitches();

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 lg:px-12">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
					<div>
						<h1 className="text-4xl font-bold text-gray-900 dark:text-white">All Pitches</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-2">Explore all pitches available on the platform.</p>
					</div>

					{/* Search + Filter/Sort */}
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
								<button className={`${Button.buttonClassName}` + " w-full md:w-auto"}>Filter & Sort</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56">
								<DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => setFilterStatus(null)}>All</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setFilterStatus("Active")}>Active</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setFilterStatus("Funded")}>Funded</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setFilterStatus("Draft")}>Draft</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setFilterStatus("Closed")}>Closed</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuLabel>Sort By</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => setSortKey("raisedDesc")}>Highest Raised</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("raisedAsc")}>Lowest Raised</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("profitDesc")}>Highest Profit Share</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("profitAsc")}>Lowest Profit Share</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("newest")}>Newest</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setSortKey("oldest")}>Oldest</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{filteredSortedPitches.length === 0 ? (
					<p className="text-gray-600 dark:text-gray-400">No pitches available.</p>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
						{filteredSortedPitches[0] && renderPitchCard(filteredSortedPitches[0], true)}
						{filteredSortedPitches.slice(1, 3).map((pitch) => renderPitchCard(pitch))}
						{filteredSortedPitches.slice(3).map((pitch) => renderPitchCard(pitch))}
					</div>
				)}
			</div>
		</div>
	);
}
