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
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { getUserProfile } from "@/lib/api/profile";

export default function BusinessDashboard() {
	const router = useRouter();
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const [userProfile, setUserProfile] = useState<any>(null);

	// fetch profile on mount
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

	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth();
		};
		verifyAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!isCheckingAuth && !authUser) {
			router.push("/login");
		}
	}, [authUser, isCheckingAuth, router]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-8">
			{/* header */}
			<header className="max-w-6xl mx-auto mb-10 text-center">
				<h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
					Welcome, {userProfile?.display_name}!
				</h1>
				<p className="text-gray-600 text-lg md:text-xl">
					Manage your pitches and track your profits all in one place.
				</p>
			</header>

			{/* dashboard cards */}
			<div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* new pitch */}
				<Item className="transition-transform transform border border-base-300 bg-base-100 p-4">
					<ItemContent className="flex items-center gap-4">
						<div>
							<ItemTitle className="text-lg font-semibold text-gray-800">
								New Pitch
							</ItemTitle>
							<ItemDescription className="text-gray-500">
								Create a new pitch to attract investors.
							</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/new")}
						>
							Create
						</Button>
					</ItemActions>
				</Item>

				{/* manage pitches */}
				<Item className="transition-transform transform border border-base-300 bg-base-100 p-4">
					<ItemContent className="flex items-center gap-4">
						<div>
							<ItemTitle className="text-lg font-semibold text-gray-800">
								Manage Pitches
							</ItemTitle>
							<ItemDescription className="text-gray-500">
								Edit or review your existing pitches.
							</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/manage")}
						>
							Manage
						</Button>
					</ItemActions>
				</Item>
			</div>
		</div>
	);
}
