"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/authStore"
import { supabase } from "@/lib/supabaseClient"
import { LoaderPinwheel } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getUserProfile } from "@/lib/api/profile"

export default function LoginPage() {
	const router = useRouter()
	const { login, authUser, checkAuth, isLoggingIn, isCheckingAuth } = useAuthStore()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	// check auth on mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// redirect if already logged in
	useEffect(() => {
		if (authUser) {
			router.push("/pitches")
		}
	}, [authUser, router])

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email || !password) {
			return window.alert("Please enter both email and password")
		}

		await login({ email, password })
		const { data: sessionData } = await supabase.auth.getSession()
		const token = sessionData?.session?.access_token
		if (token) localStorage.setItem("token", token)
	}

	if (isCheckingAuth && !authUser)
		return (
			<div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
				<LoaderPinwheel className="w-10 h-10 text-primary animate-spin" />
			</div>
		)

	return (
		<div className="flex min-h-screen">
			<div className="absolute left-[60%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent backdrop-blur-sm"></div>
			<div className="hidden lg:flex w-[60%] bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-background items-center justify-center relative overflow-hidden">
				<div className="max-w-lg text-left px-12 space-y-4">
					<h1 className="text-5xl font-bold text-primary tracking-tight leading-tight">
						Welcome Back
					</h1>
					<p className="text-lg text-gray-700 dark:text-gray-300">
						Log in to access your investor dashboard, track performance, and discover new opportunities.
					</p>
				</div>
				<div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent pointer-events-none" />
			</div>

			<div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-12 bg-gray-50 dark:bg-gray-900">
				<div className="max-w-md w-full mx-auto">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
						Log In
					</h2>

					<form onSubmit={handleLogin} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@example.com"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="bg-white dark:bg-gray-800"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="bg-white dark:bg-gray-800"
							/>
						</div>

						<Button
							type="submit"
							className={`w-full`}
							disabled={isLoggingIn}
						>
							{isLoggingIn ? (
								<LoaderPinwheel className="w-5 h-5 animate-spin" />
							) : (
								"Log In"
							)}
						</Button>
					</form>

					<p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
						Don’t have an account?{" "}
						<a
							className="text-primary hover:underline font-medium cursor-pointer"
							onClick={() => router.push("/signup")}
						>
							Sign up
						</a>
					</p>
				</div>
			</div>
		</div>
	)
}
