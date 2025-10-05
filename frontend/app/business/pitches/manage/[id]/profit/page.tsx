"use client";

import { useProtect } from "@/lib/auth/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function page() {
	const { userProfile, isLoading } = useProtect();

	const router = useRouter();

	if (userProfile?.role !== "business") {
		router.push("/investor/dashboard");
	}

	return (
		<div></div>
	)
}



