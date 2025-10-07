"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function page() {
	const router = useRouter();

	return (
		<div>
			<h1>Profit</h1>
		</div>
	)
}



