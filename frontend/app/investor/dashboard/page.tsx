"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { Wallet, CreditCard, PieChart, Loader } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function InvestorDashboardPage() {
	const router = useRouter();
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	// TODO: use this everywhere
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
		<div className="min-h-screen bg-base-100 p-6">
			<h1 className="text-3xl font-bold mb-6">Investor Dashboard</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<div className="card bg-base-100 shadow-lg p-6 flex flex-col justify-between">
					<div className="flex flex-col items-center">
						<PieChart className="w-12 h-12 text-primary mb-4" />
						<h2 className="text-xl font-semibold mb-2">Portfolio</h2>
						<p className="text-center opacity-70">View all your current investments and performance.</p>
					</div>
					<div className="mt-4 flex justify-center">
						<Button onClick={handlePortfolio}>Go to Portfolio</Button>
					</div>
				</div>

				<div className="card bg-base-100 shadow-lg p-6 flex flex-col justify-between">
					<div className="flex flex-col items-center">
						<CreditCard className="w-12 h-12 text-primary mb-4" />
						<h2 className="text-xl font-semibold mb-2">Withdraw Funds</h2>
						<p className="text-center opacity-70">Transfer your earnings from the platform to your bank account.</p>
					</div>
					<div className="mt-4 flex justify-center">
						<Button onClick={handleWithdraw}>Withdraw</Button>
					</div>
				</div>

				<div className="card bg-base-100 shadow-lg p-6 flex flex-col justify-between">
					<div className="flex flex-col items-center">
						<Wallet className="w-12 h-12 text-primary mb-4" />
						<h2 className="text-xl font-semibold mb-2">Invest</h2>
						<p className="text-center opacity-70">Browse new investment opportunities and grow your portfolio.</p>
					</div>
					<div className="mt-4 flex justify-center">
						<Button onClick={() => router.push("/browse-pitches")}>Browse Pitches</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
