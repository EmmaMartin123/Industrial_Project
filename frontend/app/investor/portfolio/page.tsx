"use client";

import { useRouter } from "next/navigation";
import { Loader, PieChart, TrendingUp, DollarSign, Search, Filter, RefreshCw, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useState, useMemo } from "react";
import * as Button from "@/components/Button";

// --- DUMMY DATA ---

interface Investment {
	id: number;
	pitchName: string;
	date: string;
	capital: number; // Initial investment amount
	currentValue: number;
	status: 'Active' | 'Pending' | 'Exited';
	industry: 'Tech' | 'Healthcare' | 'Fintech' | 'Real Estate';
}

const DUMMY_INVESTMENTS: Investment[] = [
	{ id: 1, pitchName: "Quantum Leap AI", date: "2023-01-15", capital: 50000, currentValue: 62500, status: 'Active', industry: 'Tech' },
	{ id: 2, pitchName: "MediBot Diagnostics", date: "2023-05-20", capital: 25000, currentValue: 24500, status: 'Active', industry: 'Healthcare' },
	{ id: 3, pitchName: "Future FinCap", date: "2023-11-01", capital: 40000, currentValue: 51200, status: 'Active', industry: 'Fintech' },
	{ id: 4, pitchName: "Urban Housing Trust", date: "2022-09-10", capital: 60000, currentValue: 78000, status: 'Exited', industry: 'Real Estate' },
	{ id: 5, pitchName: "Green Energy Solutions", date: "2024-02-28", capital: 30000, currentValue: 30000, status: 'Pending', industry: 'Tech' },
];

// --- UTILITY COMPONENTS ---

interface StatCardProps {
	icon: React.ElementType;
	title: string;
	value: string;
	colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, colorClass }) => (
	<div className="bg-base-100 p-6 rounded-xl shadow-lg border border-base-300 flex items-center space-x-4">
		<Icon className={`w-8 h-8 ${colorClass} flex-shrink-0`} />
		<div>
			<p className="text-sm font-medium text-gray-500">{title}</p>
			<p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
		</div>
	</div>
);

// --- MAIN COMPONENT ---

export default function InvestorPortfolioPage() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const router = useRouter();

	const [investments, setInvestments] = useState<Investment[]>(DUMMY_INVESTMENTS);
	const [filter, setFilter] = useState<'All' | 'Active' | 'Exited' | 'Pending'>('All');
	const [sortBy, setSortBy] = useState<'return' | 'date' | 'capital'>('return');

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// redirect if already logged in
	useEffect(() => {
		if (authUser) {
			router.push("/")
		}
	}, [authUser, router])

	// Derived Portfolio Metrics
	const { totalCapital, totalCurrentValue, totalReturn, totalReturnPercentage } = useMemo(() => {
		const totalCapital = investments.reduce((sum, inv) => sum + inv.capital, 0);
		const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
		const totalReturn = totalCurrentValue - totalCapital;
		const totalReturnPercentage = totalCapital > 0 ? (totalReturn / totalCapital) * 100 : 0;

		return {
			totalCapital,
			totalCurrentValue,
			totalReturn,
			totalReturnPercentage,
		};
	}, [investments]);

	// Filtering and Sorting Logic
	const filteredAndSortedInvestments = useMemo(() => {
		let filtered = investments.filter(inv => filter === 'All' || inv.status === filter);

		return filtered.sort((a, b) => {
			const returnA = a.currentValue - a.capital;
			const returnB = b.currentValue - b.capital;

			if (sortBy === 'return') return returnB - returnA;
			if (sortBy === 'capital') return b.capital - a.capital;
			// Default to date descending for "date"
			if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
			return 0;
		});
	}, [investments, filter, sortBy]);

	// Formatting function for currency
	const formatCurrency = (amount: number) => `£${new Intl.NumberFormat('en-GB').format(amount)}`;
	const formatPercent = (percent: number) => `${percent.toFixed(1)}%`;
	const getReturnColor = (amount: number) => amount >= 0 ? 'text-success' : 'text-error';
	const getStatusBadge = (status: Investment['status']) => {
		let color = '';
		if (status === 'Active') color = 'bg-primary/20 text-primary-content';
		if (status === 'Exited') color = 'bg-success/20 text-success-content';
		if (status === 'Pending') color = 'bg-warning/20 text-warning-content';
		return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${color}`}>{status}</span>;
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 p-6 flex justify-center">
			<div className="w-full max-w-7xl space-y-10 mt-10">
				<header>
					<h1 className="text-4xl font-extrabold text-gray-900">My Investment Portfolio</h1>
					<p className="text-lg text-gray-500 mt-2">A detailed breakdown of all your pitch investments.</p>
				</header>

				{/* 1. Key Metrics Section */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					<StatCard
						icon={DollarSign}
						title="Total Invested Capital"
						value={formatCurrency(totalCapital)}
						colorClass="text-info"
					/>
					<StatCard
						icon={PieChart}
						title="Current Portfolio Value"
						value={formatCurrency(totalCurrentValue)}
						colorClass="text-primary"
					/>
					<StatCard
						icon={TrendingUp}
						title="Total Return"
						value={formatCurrency(totalReturn)}
						colorClass={getReturnColor(totalReturn)}
					/>
					<StatCard
						icon={TrendingUp}
						title="Overall Return (%)"
						value={formatPercent(totalReturnPercentage)}
						colorClass={getReturnColor(totalReturn)}
					/>
				</div>

				{/* 2. Overview and Actions */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Allocation Chart Placeholder (Left Column) */}
					<div className="lg:col-span-1 bg-base-100 rounded-xl shadow-xl border border-base-300 p-6 space-y-4">
						<h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
							<PieChart className="w-5 h-5 text-warning" /> Industry Allocation
						</h2>
						<div className="bg-base-200 h-64 rounded-lg flex items-center justify-center text-gray-400">
							<p>Portfolio Allocation Chart</p>
							<p className="hidden md:block"> (e.g., Pie Chart by Industry)</p>
						</div>
						<p className="text-sm text-gray-500 pt-2">
							Diversification across {new Set(investments.map(i => i.industry)).size} industries.
						</p>
					</div>

					{/* Investment List Controls (Right Column) */}
					<div className="lg:col-span-2 bg-base-100 rounded-xl shadow-xl border border-base-300 p-6 space-y-4">
						<h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
							<DollarSign className="w-5 h-5 text-success" /> Investment Positions ({filteredAndSortedInvestments.length})
						</h2>

						<div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-4 border-b border-base-200">
							{/* Filter Dropdown */}
							<div className="flex gap-3">
								<label htmlFor="filter-status" className="text-sm font-medium text-gray-600 self-center">Filter:</label>
								<div className="relative">
									<select
										id="filter-status"
										value={filter}
										onChange={(e) => setFilter(e.target.value as any)}
										className="appearance-none bg-base-200 border border-base-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
									>
										{['All', 'Active', 'Pending', 'Exited'].map(s => (
											<option key={s} value={s}>{s} Status</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
								</div>
							</div>

							{/* Sort Dropdown */}
							<div className="flex gap-3">
								<label htmlFor="sort-by" className="text-sm font-medium text-gray-600 self-center">Sort By:</label>
								<div className="relative">
									<select
										id="sort-by"
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value as any)}
										className="appearance-none bg-base-200 border border-base-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
									>
										<option value="return">Return (High to Low)</option>
										<option value="capital">Capital Invested</option>
										<option value="date">Investment Date</option>
									</select>
									<ChevronDown className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
								</div>
							</div>
						</div>

						{/* Investment Table */}
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-base-200">
								<thead>
									<tr className="bg-base-200/50">
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tl-lg">Pitch Name</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invested</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Value</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Return (%)</th>
										<th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
										<th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tr-lg">Date</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-base-200">
									{filteredAndSortedInvestments.map(inv => {
										const netReturn = inv.currentValue - inv.capital;
										const returnPercent = inv.capital > 0 ? (netReturn / inv.capital) * 100 : 0;
										const returnColorClass = getReturnColor(netReturn);

										return (
											<tr key={inv.id} className="hover:bg-base-50 transition duration-100">
												<td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-primary hover:underline cursor-pointer">
													{inv.pitchName}
													<span className="block text-xs text-gray-500 font-normal">{inv.industry}</span>
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(inv.capital)}</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(inv.currentValue)}</td>
												<td className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${returnColorClass}`}>
													{formatPercent(returnPercent)}
												</td>
												<td className="px-4 py-4 whitespace-nowrap text-center">{getStatusBadge(inv.status)}</td>
												<td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{inv.date}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
							{filteredAndSortedInvestments.length === 0 && (
								<div className="text-center py-10 text-gray-500 text-lg">
									No investments match the current filter criteria.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
