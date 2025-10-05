"use client";

import { useAuthStore } from "@/lib/store/authStore";
import router from "next/router";
import { useEffect } from "react";

export default function page() {

	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

	// auth checks
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		if (!isCheckingAuth && !authUser) router.push("/login");
	}, [authUser, isCheckingAuth, router]);

  return (
    <div></div>
  )
}


