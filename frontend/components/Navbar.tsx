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
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings } from "lucide-react";

export default function Navbar() {
	const router = useRouter();
	const pathname = usePathname();
	const { authUser, logout, checkAuth, getId } = useAuthStore();

	const [role, setRole] = useState<string | null>(null);
	const [dashboardBalance, setDashboardBalance] = useState<number | null>(null);
	const [loadingRole, setLoadingRole] = useState(true);

	// check authentication on mount
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// fetch profile to get role and balance
	useEffect(() => {
		const fetchProfile = async () => {
			const userId = getId();
			if (!userId) {
				setLoadingRole(false);
				return;
			}

			try {
				const profile = await getMyUserProfile(userId);
				setRole(profile.role);
				setDashboardBalance(profile.dashboard_balance ?? 0);
			} catch (err) {
				console.error("Failed to fetch profile:", err);
				setRole(null);
			} finally {
				setLoadingRole(false);
			}
		};

		fetchProfile();
	}, [authUser, getId]);

	const handleLogout = async () => {
		await logout();
		router.push("/login");
	};

	const dashboardPath =
		role === "investor"
			? "/investor/dashboard"
			: role === "business"
			? "/business/dashboard"
			: "/";

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
				{/* investor links */}
				{!loadingRole && role === "investor" && (
					<>
						<Button
							variant="ghost"
							className="rounded-md border-0 cursor-pointer font-bold"
							onClick={() => router.push("/investor/dashboard")}
						>
							Dashboard
						</Button>
						<Button
							variant="ghost"
							className="rounded-md border-0 cursor-pointer font-bold"
							onClick={() => router.push("/investor/portfolio")}
						>
							My Portfolio
						</Button>
						{/* Display Dashboard Balance */}
						<div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md font-semibold">
							Balance: £{dashboardBalance?.toLocaleString()}
						</div>
					</>
				)}

				{/* business links */}
				{!loadingRole && role === "business" && (
					<>
						<Button
							variant="ghost"
							className="rounded-md border-0 cursor-pointer font-bold"
							onClick={() => router.push("/business/dashboard")}
						>
							Dashboard
						</Button>
						<Button
							variant="ghost"
							className="rounded-md border-0 cursor-pointer font-bold"
							onClick={() => router.push("/business/manage")}
						>
							My Pitches
						</Button>
					</>
				)}

				{/* profile / logout dropdown */}
				{authUser ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="relative h-10 w-10 rounded-full border-2 border-black cursor-pointer"
							>
								<Avatar className="h-9 w-9">
									<AvatarImage src="" alt="@username" />
									<AvatarFallback>
										{authUser?.email
											? authUser.email[0].toUpperCase()
											: "U"}
									</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-56" align="end" forceMount>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium leading-none">
										{authUser.email}
									</p>
									<p className="text-xs leading-none text-muted-foreground">
										Role: {loadingRole ? "Loading..." : role || "Guest"}
									</p>
									{role === "investor" && dashboardBalance !== null && (
										<p className="text-xs leading-none text-muted-foreground">
											Balance: £{dashboardBalance.toLocaleString()}
										</p>
									)}
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

							<DropdownMenuItem
								onClick={handleLogout}
								className="text-red-500 focus:bg-red-50 focus:text-red-600"
							>
								<LogOut className="mr-2 h-4 w-4" />
								<span>Log out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					pathname !== "/login" && (
						<Button className="" onClick={() => router.push("/login")}>
							Log in
						</Button>
					)
				)}
			</div>
		</nav>
	);
}
