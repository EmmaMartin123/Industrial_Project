"use client"

import { useAuthStore } from "@/lib/store/authStore"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import ThemeToggler from "@/components/ThemeToggler"
import Button from "@/components/Button"

export default function Navbar() {
	const router = useRouter()
	const pathname = usePathname()
	const { authUser, logout, checkAuth } = useAuthStore()

	const handleLogout = async () => {
		await logout()
		router.push("/login")
	}

	useEffect(() => {
		checkAuth()
	}, [checkAuth])

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
						<a
							className="btn btn-ghost"
							onClick={() => router.push("/investor/dashboard")}
						>
							My Portfolio
						</a>
						<button
							className="btn btn-error rounded-md"
							onClick={handleLogout}
						>
							Logout
						</button>
					</>
				) : (
					<>
						{/* only show if we're NOT on the login page */}
						{pathname !== "/login" && (
							<Button onClick={() => router.push("/login")}>
								Log in
							</Button>
						)}
					</>
				)}

				<ThemeToggler />
			</div>
		</nav>
	)
}
