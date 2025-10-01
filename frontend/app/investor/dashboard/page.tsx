"use client";

import { useRouter } from "next/navigation";
import { Wallet, CreditCard, PieChart, Loader, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect } from "react";
import toast from "react-hot-toast";
import * as Button from "@/components/Button";

// Define a reusable component for the list items
interface DashboardLinkProps {
	title: string;
	description: string;
	icon: React.ElementType;
	onClick: () => void;
	isPrimary?: boolean;
}

const DashboardLink: React.FC<DashboardLinkProps> = ({ title, description, icon: Icon, onClick, isPrimary = false }) => {
	return (
		<div
			className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 last:border-b-0 cursor-pointer transition duration-300 ease-in-out hover:bg-base-200/50 hover:shadow-sm"
			onClick={onClick}
		>
			<div className="flex items-start space-x-4">
				<Icon className={`w-6 h-6 ${isPrimary ? 'text-primary' : 'text-gray-500'} flex-shrink-0 mt-1`} />
				<div>
					<h3 className="text-lg font-semibold text-gray-800">{title}</h3>
					<p className="text-sm text-gray-500 mt-1">{description}</p>
				</div>
			</div>
			<ChevronRight className="w-5 h-5 text-gray-400 transition duration-300 group-hover:text-primary" />
		</div>
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 p-6 flex justify-center">
			<div className="w-full max-w-4xl space-y-10 mt-10">
				<header className="text-center pb-4">
					<h1 className="text-4xl font-extrabold text-gray-900">Investor Dashboard</h1>
					<p className="text-lg text-gray-500 mt-2">Manage your funds and investments on the platform.</p>
				</header>

				{/* Dashboard Menu Section */}
				<div className="bg-base-100 rounded-xl shadow-xl border border-base-300 divide-y divide-base-300/80">

					<DashboardLink
						title="Browse New Opportunities"
						description="Discover and invest in the latest pitches to expand your portfolio."
						icon={Wallet}
						onClick={handleInvest}
						isPrimary
					/>

					<DashboardLink
						title="View Portfolio"
						description="Track the performance of all your active investments and pitch returns."
						icon={PieChart}
						onClick={handlePortfolio}
					/>

					<DashboardLink
						title="Withdraw Funds"
						description="Securely transfer your profits and available capital to your bank account."
						icon={CreditCard}
						onClick={handleWithdraw}
					/>

				</div>

				{/* Optional Quick Link/Stats Area can go here later */}
				<div className="pt-6 text-center text-sm text-gray-500">
					Need help? Contact support or review your account settings.
				</div>
			</div>
		</div>
	);
}
