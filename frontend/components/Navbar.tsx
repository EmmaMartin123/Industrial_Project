"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { getMyUserProfile } from "@/lib/api/profile";
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
import { Button } from "@/components/ui/button";

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

	const dashboardPath =
		role === "investor" ? "/investor/dashboard" : role === "business" ? "/business/dashboard" : "/";

	return (
		<nav className="navbar bg-base-200 shadow px-4">
			<div className="flex-1">
				<a
					className="border-0 text-xl font-bold cursor-pointer ml-3"
					onClick={() => router.push("/")}
				>
					Elevare
				</a>
			</div>

			<div className="flex-none flex items-center space-x-4">
				{!loadingRole && role === "investor" && (
					<>
						<Button variant="ghost" className="rounded-md border-0 cursor-pointer font-bold" onClick={() => router.push("/investor/dashboard")}>
							Dashboard
						</Button>
						<Button variant="ghost" className="rounded-md border-0 cursor-pointer font-bold" onClick={() => router.push("/investor/portfolio")}>
							My Portfolio
						</Button>
					</>
				)}
				{!loadingRole && role === "business" && (
					<>
						<Button variant="ghost" className="rounded-md border-0 cursor-pointer font-bold" onClick={() => router.push("/business/dashboard")}>
							Dashboard
						</Button>
						<Button variant="ghost" className="rounded-md border-0 cursor-pointer font-bold" onClick={() => router.push("/business/manage")}>
							My Pitches
						</Button>
					</>
				)}

				{/* Profile / Logout Dropdown */}
				{authUser ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-black cursor-pointer">
								<Avatar className="h-9 w-9">
									<AvatarImage src="" alt="@username" />
									<AvatarFallback>{authUser?.email ? authUser.email[0].toUpperCase() : "U"}</AvatarFallback>
								</Avatar>
							</Button>
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

							<DropdownMenuItem onClick={() => router.push("/profile")}>
								<User className="mr-2 h-4 w-4" />
								<span>Profile</span>
							</DropdownMenuItem>

							<DropdownMenuItem onClick={() => router.push("/settings")}>
								<Settings className="mr-2 h-4 w-4" />
								<span>Settings</span>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-50 focus:text-red-600">
								<LogOut className="mr-2 h-4 w-4" />
								<span>Log out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					pathname !== "/login" && (
						<button onClick={() => router.push("/login")} className="btn btn-primary">
							Log in
						</button>
					)
				)}
			</div>
		</nav>
	);
}
