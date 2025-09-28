"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader } from "lucide-react"
import axios from "axios"

import { useAuthStore } from "@/lib/store/authStore"
import { supabase } from "@/lib/supabaseClient"
import Button from "@/components/Button"

export default function LoginPage() {
	const router = useRouter()
	const { login, authUser, checkAuth, isLoggingIn, isCheckingAuth } = useAuthStore()

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	// heck if user is already logged in on mount
	useEffect(() => {
		checkAuth()
	}, [checkAuth])

	// redirect to dashboard if already logged in
	useEffect(() => {
		if (authUser) router.push("/business/dashboard")
	}, [authUser, router])

	const handleLogin = async () => {
		if (!email || !password) {
			return window.alert("Please enter both email and password")
		}

		// login via auth store
		await login({ email, password })

		// after login get the jwt and send it to the backend
		const { data: sessionData } = await supabase.auth.getSession()
		const token = sessionData?.session?.access_token
		console.log("Token:", token)

		if (token) {
			// just send it and ignore the response as it doesn't send any yet
			axios.get("http://localhost:8080/api/testroute", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}).catch((err) => {
				console.warn("Token sent, ignoring backend response:", err.message)
			})
		} else {
			console.warn("No JWT found after login")
		}
	}

	if (isCheckingAuth && !authUser) return (
		<div className="flex items-center justify-center h-screen">
			<Loader className="size-10 animate-spin" />
		</div>
	);

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="card w-full max-w-sm shadow-xl bg-base-100 mb-40">
				<div className="card-body">
					<h2 className="card-title text-center text-2xl mb-4">Login</h2>

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
						<Button
							onClick={handleLogin}
							isLoading={isLoggingIn}
							loadingText="Logging in..."
						>
							Log in
						</Button>
					</div>

					<div className="text-center mt-4">
						<p className="text-center text-sm">
							Don't have an account?{" "}
							<a
								className="link link-primary"
								onClick={() => router.push("/signup")}
							>
								Sign up
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
