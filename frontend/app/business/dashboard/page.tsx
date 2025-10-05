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
import { useProtect } from "@/lib/auth/auth";
import { useEffect } from "react";

export default function BusinessDashboard() {
	const { userProfile, isLoading } = useProtect();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && userProfile && userProfile.role !== "business") {
			router.push("/investor/dashboard");
		}
	}, [userProfile, isLoading, router]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-8">
			{/* header */}
			<header className="max-w-6xl mx-auto mb-10 text-center">
				<h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
					Welcome, {userProfile?.display_name || "Business Owner"}!
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
							<ItemTitle className="text-lg font-semibold text-gray-800">New Pitch</ItemTitle>
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
							<ItemTitle className="text-lg font-semibold text-gray-800">Manage Pitches</ItemTitle>
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
