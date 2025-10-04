"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { getMyUserProfile } from "@/lib/api/profile";
import ThemeToggler from "@/components/ThemeToggler";
import * as Button from "@/components/Button";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button as ShadcnButton } from "@/components/ui/button";
import { LogOut, LayoutDashboard, User, Settings, Zap } from "lucide-react";


export default function Navbar() {
	const router = useRouter();
	const pathname = usePathname();
	const { authUser, logout, checkAuth, getId } = useAuthStore();

	const [role, setRole] = useState<string | null>(null);
	const [loadingRole, setLoadingRole] = useState(true);

	// check authentication on mount
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// fetch profile to get role
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

	const dashboardPath = role === "investor" ? "/investor/dashboard" : role === "business" ? "/business/dashboard" : "/";

	return (
		<nav className="navbar bg-base-200 shadow px-4">
			<div className="flex-1">
				<a
					className="btn btn-ghost normal-case text-xl hover:shadow-md rounded-full"
					onClick={() => router.push("/")}
				>
					Elevare
				</a>
			</div>

			<div className="flex-none flex items-center space-x-2">
				{/*
				<div className="hidden md:block">
					<ThemeToggler />
				</div>
				*/}

				{authUser ? (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<ShadcnButton variant="ghost" className="relative h-10 w-10 rounded-full border-2 cursor-pointer hover:shadow-md">
									<Avatar className="h-9 w-9">
										<AvatarImage src="" alt="@username" />
										<AvatarFallback>{authUser?.email ? authUser.email[0].toUpperCase() : 'U'}</AvatarFallback>
									</Avatar>
								</ShadcnButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end" forceMount>
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<p className="text-sm font-medium leading-none">{authUser.email}</p>
										<p className="text-xs leading-none text-muted-foreground">
											Role: {loadingRole ? "Loading..." : role || "Guest"}
										</p>
									</div>
								</DropdownMenuLabel>

								<DropdownMenuSeparator />

								{!loadingRole && (role === "investor" || role === "business") && (
									<DropdownMenuItem onClick={() => router.push(dashboardPath)}>
										<LayoutDashboard className="mr-2 h-4 w-4" />
										<span>Dashboard</span>
									</DropdownMenuItem>
								)}

								<DropdownMenuItem onClick={() => router.push("/profile")}>
									<User className="mr-2 h-4 w-4" />
									<span>Profile</span>
								</DropdownMenuItem>

								{role === "business" && (
									<DropdownMenuItem onClick={() => router.push("/business/pitches/manage")}>
										<Zap className="mr-2 h-4 w-4" />
										<span>My Pitches</span>
									</DropdownMenuItem>
								)}

								<DropdownMenuItem onClick={() => router.push("/settings")}>
									<Settings className="mr-2 h-4 w-4" />
									<span>Settings</span>
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								{/* --- Logout Button --- */}
								<DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-50 focus:text-red-600">
									<LogOut className="mr-2 h-4 w-4" />
									<span>Log out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

					</>
				) : (
					pathname !== "/login" && (
						<ShadcnButton
							onClick={() => router.push("/login")}
						>
							Log in
						</ShadcnButton>
					)
				)}
			</div>
		</nav>
	);
}
