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
import ThemeToggler from "./ThemeToggler";

export default function Navbar() {
	const router = useRouter();
	const pathname = usePathname();
	const { authUser, logout, checkAuth, getId } = useAuthStore();

	const [role, setRole] = useState<string | null>(null);
	const [dashboardBalance, setDashboardBalance] = useState<number | null>(null);
	const [loadingRole, setLoadingRole] = useState(true);

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

		if (authUser) {
			fetchProfile();
		} else {
			setLoadingRole(false);
		}
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
		<nav className="navbar bg-base-200 shadow px-4 flex justify-between items-center w-full">
			{/* left section: logo */}
			<div className="flex-1">
				<a
					className="border-0 text-xl font-bold cursor-pointer ml-3"
					onClick={() => router.push("/")}
				>
					Elevare
				</a>
			</div>

			<div className="flex items-center space-x-4 justify-center">

				<Button
					variant="ghost"
					className="rounded-md border-0 cursor-pointer font-bold"
					onClick={() => router.push("/pitches")}
				>
					Browse
				</Button>

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
						{/* display dashboard balance */}
						<div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md font-semibold cursor-pointer">
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
							onClick={() => router.push("/business/pitches/manage")}
						>
							My Pitches
						</Button>
					</>
				)}
			</div>

			{/* right section: profile/logout and login button */}
			<div className="flex-1 flex justify-end items-center space-x-4">
				{pathname !== "/login" && (
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
											: "G"}
									</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent className="w-56" align="end" forceMount>
							{/* logged in view */}
							{authUser ? (
								<>
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
								</>
							) : (
								// logged out view
								<>
									<DropdownMenuLabel className="font-normal">
										<p className="text-sm font-medium leading-none">
											Guest
										</p>
									</DropdownMenuLabel>

									<DropdownMenuSeparator />

									<DropdownMenuItem onClick={() => router.push("/login")}>
										<LogOut className="mr-2 h-4 w-4" />
										<span>Log in</span>
									</DropdownMenuItem>

									<DropdownMenuItem onClick={() => router.push("/signup")}>
										<User className="mr-2 h-4 w-4" />
										<span>Sign up</span>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</nav>
	);
}
