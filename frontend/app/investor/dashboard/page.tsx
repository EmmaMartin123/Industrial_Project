"use client";

import { useRouter } from "next/navigation";
import { Wallet, CreditCard, PieChart, Loader } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useState} from "react";
import toast from "react-hot-toast";
import * as Button from "@/components/Button";

//backend
interface InvestorDashboardPage {
	totalInvested: number;
	expectedReturns: number;
	activeProjects: number;
}

export default function InvestorDashboardPage() {
	const router = useRouter();
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const [stats, setStats] = useState<InvestorDashboardPage | null>(null);
	const [isLoading, setIsLoading] = useState(true);

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
			router.push("/login");
		}
	}, [authUser, isCheckingAuth, router]);

	// show loader while checking auth
	if (isCheckingAuth || !authUser) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader className="w-10 h-10 animate-spin" />
			</div>
		);
	}

	const handlePortfolio = () => {
		router.push("/investor/portfolio");
	};

	const handleWithdraw = () => {
		router.push("/investor/withdraw");
	};

	return (
		<div className="min-h-screen bg-base-100 px-6 py-10">
			<div className="max-w-5xl mx-auto mb-10 text-center">
				<h1 className="text-4xl font-bold mb-3">Welcome to your investor dashboard, {authUser?.email?.split("@")[0]|| "Investor"}!</h1>
				<p className="text-lg opacity-70">
				    Track your investments, monitor growth, and identify new opportunities. 
				</p>
			</div>

			<div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
				<div className="card bg-primary text-white shadow-lg p-6 rounded-xl">
					<p className="opacity-80 text-sm mb-1">Total Invested</p>
					<h2 className="text-2xl font-bold">£222,222</h2>
				</div>
				<div className="card bg-secondary text-white shadow-lg p-6 rounded-xl">
					<p className="opacity-80 text-sm mb-1">Expected Returns</p>
					<h2 className="text-2xl font-bold">£111,111</h2>
				</div>
				<div className="card bg-accent text-white shadow-lg p-6 rounded-xl">
					<p className="opacity-80 text-sm mb-1">Active Projects</p>
					<h2 className="text-2xl font-bold">11</h2>
				</div>
			</div>

			<div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
				<div className="card bg-base-100 shadow-md hover:shadow-xl transition rounded-xl p-6 flex flex-col items-center text-center">
					<PieChart className="w-12 h-12 text-primary mb-4" />
					<h2 className="text-xl font-semibold mb-2">Portfolio</h2>
					<p className="text-sm opacity-70 mb-6">
						View all your current investments.
					</p>
					<button
						className={`${Button.buttonClassName} w-full`}
						onClick={handlePortfolio}
					>
						View Portfolio
					</button>
				</div>

				<div className="card bg-base-100 shadow-md hover:shadow-xl transition rounded-xl p-6 flex flex-col items-center text-center">
					<CreditCard className="w-12 h-12 text-primary mb-4" />
					<h2 className="text-xl font-semibold mb-2">Withdraw Funds</h2>
					<p className="text-sm opacity-70 mb-6">
					    Transfer the money you make to your bank account.
					</p>
					<button
						className={`${Button.buttonClassName} w-full`}
						onClick={handleWithdraw}
					>
						Withdraw
					</button>
				</div>

				<div className="card bg-base-100 shadow-md hover:shadow-xl transition rounded-xl p-6 flex flex-col items-center text-center">
					<Wallet className="w-12 h-12 text-primary mb-4" />
					<h2 className="text-xl font-semibold mb-2">Invest</h2>
					<p className="text-sm opacity-70 mb-6">
					    Discover new investment opportunities.
					</p>
					<button
						className={`${Button.buttonClassName} w-full`}
						onClick={() => router.push("/browse-pitches")}
					>
						Browse Pitches
					</button>
				</div>
			</div>
		</div>
	);
}