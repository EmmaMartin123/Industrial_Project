"use client";

import { Loader } from "lucide-react";
import { useProtect } from "@/lib/auth/auth";

export default function DashboardPage() {
	const { userProfile, isLoading } = useProtect();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen bg-base-200">
				<Loader className="w-10 h-10 text-primary animate-spin" />
			</div>
		);
	}

	return (
		<div>
			<h1>Welcome, {userProfile?.display_name}!</h1>
			<p>Email: {userProfile?.email}</p>
		</div>
	);
}
