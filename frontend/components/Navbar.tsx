"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { getMyUserProfile } from "@/lib/api/profile";
import ThemeToggler from "@/components/ThemeToggler";
import * as Button from "@/components/Button";

export default function Navbar() {
	const router = useRouter();
	const pathname = usePathname();
	const { authUser, logout, checkAuth, getId } = useAuthStore();

	const [role, setRole] = useState<string | null>(null);
	const [loadingRole, setLoadingRole] = useState(true);

	// Check authentication on mount
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// Fetch profile to get role
	useEffect(() => {
		const fetchRole = async () => {
			const userId = getId();
			if (!userId) {
				setLoadingRole(false);
				return;
			}

			try {
				const profile = await getMyUserProfile(userId);
				setRole(profile.role);
			} catch (err) {
				console.error("Failed to fetch profile:", err);
				setRole(null);
			} finally {
				setLoadingRole(false);
			}
		};

		fetchRole();
	}, [authUser, getId]);

	const handleLogout = async () => {
		await logout();
		router.push("/login");
	};

	return (
		<nav className="navbar bg-base-200 shadow px-4">
			<div className="flex-1">
				<a
					className="btn btn-ghost normal-case text-xl"
					onClick={() => router.push("/")}
				>
					Elevare
				</a>
			</div>

			<div className="flex-none hidden md:flex space-x-2">
				{authUser ? (
					<>
						{!loadingRole && role === "investor" && (
							<a
								className={`${Button.buttonClassName}`}
								onClick={() => router.push("/investor/dashboard")}
							>
								Investor Dashboard
							</a>
						)}
						{!loadingRole && role === "business" && (
							<a
								className={`${Button.buttonClassName}`}
								onClick={() => router.push("/business/dashboard")}
							>
								Business Dashboard
							</a>
						)}

						<ThemeToggler />

						<button
							className={`${Button.buttonOutlineClassName} border-red-500 text-red-500 hover:bg-red-100`}
							onClick={handleLogout}
						>
							Logout
						</button>
					</>
				) : (
					pathname !== "/login" && (
						<button
							className={`${Button.buttonClassName}`}
							onClick={() => router.push("/login")}
						>
							Log in
						</button>
					)
				)}
			</div>
		</nav>
	);
}
