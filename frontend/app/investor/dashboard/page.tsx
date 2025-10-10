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
import LoaderComponent from "@/components/Loader";

export default function InvestorDashboard() {
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const router = useRouter();
	const [userProfile, setUserProfile] = useState<any>(null);
	const [isFetchingProfile, setIsFetchingProfile] = useState(false);

	// fetch profile on mount
	useEffect(() => {
		const fetchProfile = async () => {
			console.log(authUser);
			if (authUser?.id) {
				try {
					setIsFetchingProfile(true);
					const profile = await getUserProfile(authUser.id);
					setUserProfile(profile);
				} catch (err) {
					console.error("Failed to fetch user profile:", err);
				} finally {
					setIsFetchingProfile(false);
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
		if (!authUser && !isCheckingAuth) {
			router.push("/")
		}
	}, [authUser, router])

	if (isCheckingAuth || isFetchingProfile) {
		return <LoaderComponent />;
	} 

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
			</div>
		</div>
	);
}
