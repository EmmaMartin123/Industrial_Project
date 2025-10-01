"use client";

import { useRouter } from "next/navigation";
import { Wallet, CreditCard, PieChart, Loader, ArrowRight, TrendingUp, DollarSign } from "lucide-react"; // Added new icons
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect } from "react";
import toast from "react-hot-toast";
import * as Button from "@/components/Button";

// Reusable component for quick action buttons
interface QuickActionButtonProps {
	title: string;
	description: string;
	icon: React.ElementType;
	onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ title, description, icon: Icon, onClick }) => {
	return (
		<button
			onClick={onClick}
			className="group flex flex-col items-start p-4 bg-base-100 rounded-lg shadow-sm border border-base-300 transition duration-200 hover:bg-primary/5 hover:border-primary/50 hover:shadow-md"
		>
			<Icon className="w-7 h-7 text-primary mb-2 transition-transform duration-200 group-hover:scale-105" />
			<h3 className="text-lg font-semibold text-gray-800 text-left">{title}</h3>
			<p className="text-sm text-gray-500 text-left mt-1">{description}</p>
			<span className="mt-3 text-primary flex items-center gap-1 text-sm font-medium">
				Go <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
			</span>
		</button>
	);
};

export default function InvestorDashboardPage() {
	const router = useRouter();
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

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
			const timer = setTimeout(() => {
				router.push("/login");
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [authUser, isCheckingAuth, router]);

	// show loader while checking auth
	if (isCheckingAuth || !authUser) {
		return (
			<div className="flex items-center justify-center h-screen bg-base-200">
				<Loader className="w-10 h-10 text-primary animate-spin" />
			</div>
		);
	}

	const handlePortfolio = () => {
		router.push("/investor/portfolio");
	};

	const handleWithdraw = () => {
		router.push("/investor/withdraw");
	};

	const handleInvest = () => {
		router.push("/browse-pitches");
	};

	// Dummy data for quick stats - replace with actual data later
	const totalInvestments = "£125,000";
	const currentPortfolioValue = "£138,500";
	const totalProfit = "£13,500";
	const activePitches = 7;

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 p-6 flex justify-center">
			<div className="w-full max-w-6xl space-y-10 mt-10">
				{/* Hero Section / Welcome & Quick Stats */}
				<div className="bg-primary/10 rounded-xl p-8 sm:p-10 border border-primary/20 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
					<div className="text-center md:text-left">
						<h1 className="text-4xl font-extrabold text-primary tracking-tight mb-2">Welcome, Investor!</h1>
						<p className="text-lg text-primary/80 max-w-2xl">
							Here's a quick overview of your investment activity and opportunities.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
						<div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300 text-center">
							<p className="text-xs text-gray-500">Total Invested</p>
							<p className="text-xl font-bold text-gray-800">{totalInvestments}</p>
						</div>
						<div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300 text-center">
							<p className="text-xs text-gray-500">Current Value</p>
							<p className="text-xl font-bold text-success">{currentPortfolioValue}</p>
						</div>
					</div>
				</div>

				{/* Main Content Area: Overview + Actions */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column: Detailed Overview / Stats */}
					<div className="lg:col-span-2 bg-base-100 rounded-xl shadow-xl border border-base-300 p-6 sm:p-8 space-y-6">
						<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
							<PieChart className="w-6 h-6 text-primary" /> Portfolio Overview
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
							<div className="p-4 bg-base-200 rounded-lg">
								<p className="text-sm text-gray-500">Total Profit</p>
								<p className="text-2xl font-bold text-success mt-1">{totalProfit}</p>
							</div>
							<div className="p-4 bg-base-200 rounded-lg">
								<p className="text-sm text-gray-500">Active Pitches</p>
								<p className="text-2xl font-bold text-info mt-1">{activePitches}</p>
							</div>
							<div className="p-4 bg-base-200 rounded-lg">
								<p className="text-sm text-gray-500">Upcoming Returns</p>
								<p className="text-2xl font-bold text-warning mt-1">£5,000</p> {/* Placeholder */}
							</div>
						</div>

						{/* Chart Placeholder */}
						<div className="bg-base-200 h-64 rounded-lg flex items-center justify-center text-gray-400">
							<p>Investment Performance Chart (Coming Soon)</p>
						</div>

						<div className="flex justify-center mt-6">
							<button
								className={`${Button.buttonClassName} btn-outline`}
								onClick={handlePortfolio}
							>
								<TrendingUp className="w-5 h-5" /> View Full Portfolio
							</button>
						</div>
					</div>

					{/* Right Column: Quick Actions */}
					<div className="lg:col-span-1 space-y-4">
						<h2 className="text-xl font-bold text-gray-800 mb-4 px-2">Quick Actions</h2>
						<QuickActionButton
							title="Browse Pitches"
							description="Discover new opportunities to expand your investment portfolio."
							icon={Wallet}
							onClick={handleInvest}
						/>
						<QuickActionButton
							title="Withdraw Earnings"
							description="Securely transfer your available profits to your bank account."
							icon={CreditCard}
							onClick={handleWithdraw}
						/>
						{/* Add more quick actions as needed */}
						<div className="p-4 bg-base-100 rounded-xl border border-base-300 text-center text-sm text-gray-500">
							Need help? <a href="#" className="text-primary hover:underline">Contact Support</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
