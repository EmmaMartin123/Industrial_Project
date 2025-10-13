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
import LoaderComponent from "@/components/Loader";

export default function BusinessDashboard() {
	const router = useRouter();
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	// state for user profile and its loading status
	const [userProfile, setUserProfile] = useState<any>(null);
	const [isFetchingProfile, setIsFetchingProfile] = useState(false);

	// fetch profile data on mount if user is authenticated
	useEffect(() => {
		const fetchProfile = async () => {
			if (authUser?.id) {
				try {
					setIsFetchingProfile(true);
					const profile = await getUserProfile(authUser.id);
					setUserProfile(profile);
				} catch (err) {
					console.error("failed to fetch user profile:", err);
				} finally {
					setIsFetchingProfile(false);
				}
			}
		};
		fetchProfile();
	}, [authUser?.id]);

	// verify authentication status on component mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth();
		};
		verifyAuth();
	}, [checkAuth]);

	// redirect to login if not authenticated after checking
	useEffect(() => {
		if (!isCheckingAuth && !authUser) {
			router.push("/login");
		}
	}, [authUser, isCheckingAuth, router]);

	// show loader while checking auth or fetching profile
	if (isCheckingAuth || isFetchingProfile) {
		return <LoaderComponent />;
	}

	// render dashboard with links relevant to a business user
	return (
		<div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-8">
			<header className="max-w-6xl mx-auto mb-10 text-center">
				<h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
					welcome, {userProfile?.display_name}!
				</h1>
				<p className="text-gray-600 text-lg md:text-xl">
					manage your pitches and track your profits all in one place.
				</p>
			</header>

			<div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* card for creating a new pitch */}
				<Item className="transition-transform transform border border-base-300 bg-base-100 p-4">
					<ItemContent className="flex items-center gap-4">
						<div>
							<ItemTitle className="text-lg font-semibold text-gray-800">
								new pitch
							</ItemTitle>
							<ItemDescription className="text-gray-500">
								create a new pitch to attract investors.
							</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/new")}
						>
							create
						</Button>
					</ItemActions>
				</Item>

				{/* card for managing existing pitches */}
				<Item className="transition-transform transform border border-base-300 bg-base-100 p-4">
					<ItemContent className="flex items-center gap-4">
						<div>
							<ItemTitle className="text-lg font-semibold text-gray-800">
								manage pitches
							</ItemTitle>
							<ItemDescription className="text-gray-500">
								edit or review your existing pitches.
							</ItemDescription>
						</div>
					</ItemContent>
					<ItemActions>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.push("/business/pitches/manage")}
						>
							manage
						</Button>
					</ItemActions>
				</Item>
			</div>
		</div>
	);
}
