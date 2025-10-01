"use client";

import { useRouter } from "next/navigation";
import { Wallet, CreditCard, PieChart, Loader } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect } from "react";
import toast from "react-hot-toast";
import * as Button from "@/components/Button";

// Reusable style for the content cards
const dashboardCardStyle = "card bg-base-100 shadow-xl p-8 flex flex-col justify-between border border-base-300 transition duration-300 hover:shadow-2xl hover:border-primary/50";
const dashboardIconStyle = "w-12 h-12 text-primary mb-4 transition duration-300 group-hover:scale-105";

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
			// Use a timeout to ensure the state update is processed before redirecting
			// and avoid flashing unauthorized content.
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 p-6 flex justify-center">
			<div className="w-full max-w-5xl space-y-12 mt-10">
				<h1 className="text-4xl font-extrabold text-center text-gray-800">Your Investor Hub</h1>
				<p className="text-center text-lg text-gray-500 max-w-2xl mx-auto">
					Manage your capital, track your growth, and discover new opportunities.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Portfolio Card */}
					<div className={`${dashboardCardStyle} group`}>
						<div className="flex flex-col items-center">
							<PieChart className={dashboardIconStyle} />
							<h2 className="text-2xl font-bold mb-2 text-gray-700">Portfolio</h2>
							<p className="text-center text-sm opacity-70 mb-6">
								View all your current investments and performance metrics at a glance.
							</p>
						</div>
						<div className="flex justify-center">
							<button
								className={`${Button.buttonClassName} w-full`}
								onClick={handlePortfolio}
							>
								Track Investments
							</button>
						</div>
					</div>

					{/* Withdraw Funds Card */}
					<div className={`${dashboardCardStyle} group`}>
						<div className="flex flex-col items-center">
							<CreditCard className={dashboardIconStyle} />
							<h2 className="text-2xl font-bold mb-2 text-gray-700">Withdraw Funds</h2>
							<p className="text-center text-sm opacity-70 mb-6">
								Transfer your earnings from successful pitches to your bank account securely.
							</p>
						</div>
						<div className="flex justify-center">
							<button
								className={`${Button.buttonClassName} btn-outline w-full`}
								onClick={handleWithdraw}
							>
								Withdraw
							</button>
						</div>
					</div>

					{/* Invest Card */}
					<div className={`${dashboardCardStyle} group`}>
						<div className="flex flex-col items-center">
							<Wallet className={dashboardIconStyle} />
							<h2 className="text-2xl font-bold mb-2 text-gray-700">Invest</h2>
							<p className="text-center text-sm opacity-70 mb-6">
								Browse new investment opportunities and find the next big idea to back.
							</p>
						</div>
						<div className="flex justify-center">
							<button
								className={`${Button.buttonClassName} w-full`}
								onClick={() => router.push("/browse-pitches")}
							>
								Browse Pitches
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
