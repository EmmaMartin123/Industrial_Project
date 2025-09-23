"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useAuthStore } from "@/store/authStore"
import { Loader } from "lucide-react"

export default function SignupPage() {
	const router = useRouter()
	const { signup, authUser, checkAuth, isSigningUp, isCheckingAuth } = useAuthStore()

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	// heck if user is already logged in on mount
	useEffect(() => {
		checkAuth()
	}, [checkAuth])

	// redirect to dashboard if already logged in
	useEffect(() => {
		if (authUser) router.push("/dashboard")
	}, [authUser, router])

	const handleSignup = () => {
		if (!email || !password) {
			return window.alert("Please enter both email and password") // could put this inside the store itself?
		}

		signup({ email, password })
	}

	if (isCheckingAuth && !authUser) return (
		<div className="flex items-center justify-center h-screen">
			<Loader className="size-10 animate-spin" />
		</div>
	);

	console.log(authUser)


	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="card w-full max-w-sm shadow-xl bg-base-100">
				<div className="card-body">
					<h2 className="card-title text-center mb-4">Sign Up</h2>
					<input
						type="email"
						placeholder="Email"
						className="input input-bordered w-full mb-3"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<input
						type="password"
						placeholder="Password"
						className="input input-bordered w-full mb-4"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<div className="flex justify-between">
						<button
							className="btn btn-primary rounded-md"
							onClick={handleSignup}
							disabled={isSigningUp}
						>
							{isSigningUp ? "Signing up..." : "Sign up"}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
