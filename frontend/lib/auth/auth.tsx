{ /* 
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { getMyUserProfile, } from "../api/profile";
import { Profile } from "../types/profile";

export const useProtect = () => {
	const router = useRouter();
	const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
	const [userProfile, setUserProfile] = useState<Profile | null>(null);
	const [loadingUserProfile, setLoadingUserProfile] = useState(true);

	// check auth on mount
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// redirect if not logged in
	useEffect(() => {
		if (!isCheckingAuth && !authUser) {
			router.push("/login");
		} else if (authUser) {
			// fetch profile
			const fetchProfile = async () => {
				setLoadingUserProfile(true);
				const profile = await getMyUserProfile(authUser.id);
				setUserProfile(profile);
				setLoadingUserProfile(false);
			};
			fetchProfile();
		}
	}, [authUser, isCheckingAuth, router]);

	console.log("userProfile", userProfile);

	return { userProfile, isLoading: isCheckingAuth || loadingUserProfile };
};

*/ }

