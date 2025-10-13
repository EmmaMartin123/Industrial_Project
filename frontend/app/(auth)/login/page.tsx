"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/authStore"
import { supabase } from "@/lib/supabaseClient"
import { LoaderPinwheel } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
	// initialise router and destructure state/actions from the global authentication store
	const router = useRouter()
	const { login, authUser, checkAuth, isLoggingIn, isCheckingAuth } = useAuthStore()
	// local component state for form input values
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	// useEffect hook to verify the user's authentication status immediately on component mount
	useEffect(() => {
		const verifyAuth = async () => {
			await checkAuth()
		}
		verifyAuth()
	}, [checkAuth])

	// useEffect hook to redirect the user to the /pitches page if they are already logged in
	useEffect(() => {
		if (authUser) {
			router.push("/pitches")
		}
	}, [authUser, router])

	// handles the form submission for login
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		// client side validation check
		if (!email || !password) {
			return window.alert("please enter both email and password")
		}

		// call the login function and handle session token storage
		await login({ email, password })
		const { data: sessionData } = await supabase.auth.getSession()
		const token = sessionData?.session?.access_token
		if (token) localStorage.setItem("token", token)
	}

	// display a fullscreen loading spinner while the initial authentication check is running
	if (isCheckingAuth && !authUser)
		return (
			<div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
				<LoaderPinwheel className="w-10 h-10 text-primary animate-spin" />
			</div>
		)

	// main component return: renders the two column login layout
	return (
		<div className="flex min-h-screen">
			{/* decorative left side panel for large screens */}
			<div className="absolute left-[60%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent backdrop-blur-sm"></div>
			<div className="hidden lg:flex w-[60%] bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-background items-center justify-center relative overflow-hidden">
				<div className="max-w-lg text-left px-12 space-y-4">
					<h1 className="text-5xl font-bold text-primary tracking-tight leading-tight">
						welcome back
					</h1>
					<p className="text-lg text-gray-700 dark:text-gray-300">
						log in to access your investor dashboard, track performance, and discover new opportunities.
					</p>
				</div>
				<div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent pointer-events-none" />
			</div>

			{/* login form area */}
			<div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-12 bg-gray-50 dark:bg-gray-900">
				<div className="max-w-md w-full mx-auto">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
						log in
					</h2>

					{/* the login form */}
					<form onSubmit={handleLogin} className="space-y-6">
						{/* email input field */}
						<div className="space-y-2">
							<Label htmlFor="email">email</Label>
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

						{/* password input field */}
						<div className="space-y-2">
							<Label htmlFor="password">password</Label>
							<Input
								id="password"
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="bg-white dark:bg-gray-800"
							/>
						</div>

						{/* submit button with loading state */}
						<Button
							type="submit"
							className={`w-full`}
							disabled={isLoggingIn}
						>
							{isLoggingIn ? (
								<LoaderPinwheel className="w-5 h-5 animate-spin" />
							) : (
								"log in"
							)}
						</Button>
					</form>

					{/* sign up link */}
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
						don’t have an account?{" "}
						<a
							className="text-primary hover:underline font-medium cursor-pointer"
							onClick={() => router.push("/signup")}
						>
							sign up
						</a>
					</p>
				</div>
			</div>
		</div>
	)
}
