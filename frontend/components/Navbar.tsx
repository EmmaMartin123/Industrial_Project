"use client"

import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Navbar() {
	const router = useRouter()
	const { authUser, logout, checkAuth } = useAuthStore()

	const handleLogout = async () => {
		await logout()
		router.push("/login")
	}

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

	console.log(authUser)

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
				<a className="btn btn-ghost" onClick={() => router.push("/browse")}>
					Browse Pitches
				</a>

				{authUser ? (
					<>
						<a
							className="btn btn-ghost"
							onClick={() => router.push("/dashboard")}
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
						<button
							className="btn btn-primary rounded-md"
							onClick={() => router.push("/login")}
						>
							Sign In
						</button>
						<button
							className="btn btn-secondary rounded-md"
							onClick={() => router.push("/signup")}
						>
							Sign Up
						</button>
					</>
				)}
			</div>
		</nav>
	)
}
