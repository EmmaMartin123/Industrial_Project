"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import { PlusCircle, Users, Coins } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/api/profile";

export default function InvestorDashboard() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const router = useRouter();
	const [userProfile, setUserProfile] = useState<any>(null);

	useEffect(() => {
		const fetchProfile = async () => {
			console.log(authUser);
			if (authUser?.id) {
				try {
					const profile = await getUserProfile(authUser.id);
					setUserProfile(profile);
				} catch (err) {
					console.error("Failed to fetch user profile:", err);
				}
			}
		};
		fetchProfile();
	}, [authUser?.id]);

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	useEffect(() => {
		if (!authUser) {
			router.push("/")
		}
	}, [authUser, router])

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-8">
			{/* header */}
			<header className="max-w-6xl mx-auto mb-10 text-center">
				<h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
					Welcome, {userProfile?.display_name || "Business Owner"}!
				</h1>
				<p className="text-gray-600 text-lg md:text-xl">

				</p>
			</header>

			{/* dashboard cards */}
			<div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">

				{ /* view portfolio */}
				<Item className="transition-transform transform border border-base-300 bg-base-100 p-4">
					<ItemContent className="flex items-center gap-4">
						<div>
							<ItemTitle className="text-lg font-semibold text-gray-800">My Portfolio</ItemTitle>
							<ItemDescription className="text-gray-500">
								View your current portfolio and track your investments.
							</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/new")}
						>
							View
						</Button>
					</ItemActions>
				</Item>

				{/* top up balance */}
				<Item className="transition-transform transform border border-base-300 bg-base-100 p-4">
					<ItemContent className="flex items-center gap-4">
						<div>
							<ItemTitle className="text-lg font-semibold text-gray-800">Top Up Balance</ItemTitle>
							<ItemDescription className="text-gray-500">
								Top up your balance to start investing.
							</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/manage")}
						>
							Top Up
						</Button>
					</ItemActions>
				</Item>

				{/* withdraw funds */}
				<Item className="transition-transform transform border border-base-300 bg-base-100 p-4">
					<ItemContent className="flex items-center gap-4">
						<div>
							<ItemTitle className="text-lg font-semibold text-gray-800">Withdraw Funds</ItemTitle>
							<ItemDescription className="text-gray-500">
								Withdraw funds from your portfolio to your bank account.
							</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/manage")}
						>
							Withdraw
						</Button>
					</ItemActions>
				</Item>
			</div>
		</div>
	);
}
